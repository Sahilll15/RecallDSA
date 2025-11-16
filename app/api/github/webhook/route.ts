import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseProblemInfo, isCodeFile } from "@/lib/github"
import crypto from "crypto"

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret)
  const digest = "sha256=" + hmac.update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-hub-signature-256")
    const body = await request.text()
    
    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 401 })
    }

    let payload: any
    
    if (body.startsWith("payload=")) {
      const urlEncodedPayload = body.substring(8)
      const decodedPayload = decodeURIComponent(urlEncodedPayload)
      payload = JSON.parse(decodedPayload)
    } else {
      payload = JSON.parse(body)
    }
    
    if (!payload.repository?.full_name) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const repo = await prisma.repo.findFirst({
      where: { fullName: payload.repository.full_name },
      include: { user: true },
    })

    if (!repo || !repo.webhookSecret) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    if (!verifySignature(body, signature, repo.webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    if (payload.commits && Array.isArray(payload.commits)) {
      const allFiles = new Set<string>()
      const addedFiles = new Set<string>()
      
      for (const commit of payload.commits) {
        if (commit.added) {
          commit.added.forEach((f: string) => {
            allFiles.add(f)
            addedFiles.add(f)
          })
        }
        if (commit.modified) commit.modified.forEach((f: string) => allFiles.add(f))
      }

      for (const filePath of allFiles) {
        if (!isCodeFile(filePath)) continue

        const filename = filePath.split("/").pop()!
        const { platform, difficulty, title, language } = parseProblemInfo(filePath, filename)

        const problem = await prisma.problem.upsert({
          where: {
            repoId_path: {
              repoId: repo.id,
              path: filePath,
            },
          },
          update: {
            title,
            platform,
            difficulty,
            language,
            sha: payload.after || "",
            updatedAt: new Date(),
          },
          create: {
            repoId: repo.id,
            path: filePath,
            sha: payload.after || "",
            title,
            platform,
            difficulty,
            language,
          },
        })

        if (addedFiles.has(filePath)) {
          const sevenDaysFromNow = new Date()
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

          await prisma.revision.upsert({
            where: {
              userId_problemId: {
                userId: repo.userId,
                problemId: problem.id,
              },
            },
            update: {},
            create: {
              userId: repo.userId,
              problemId: problem.id,
              nextDate: sevenDaysFromNow,
              intervalDays: 7,
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


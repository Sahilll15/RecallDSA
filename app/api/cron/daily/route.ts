import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendRevisionReminder } from "@/lib/email"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const dueRevisions = await prisma.revision.findMany({
      where: {
        nextDate: {
          lte: today,
        },
      },
      include: {
        user: true,
        problem: true,
      },
    })

    const userRevisionsMap = new Map<string, typeof dueRevisions>()
    
    for (const revision of dueRevisions) {
      const userId = revision.userId
      if (!userRevisionsMap.has(userId)) {
        userRevisionsMap.set(userId, [])
      }
      userRevisionsMap.get(userId)!.push(revision)
    }

    let emailsSent = 0

    for (const [userId, revisions] of userRevisionsMap) {
      const user = revisions[0].user
      
      if (!user.email) continue

      const problems = revisions.map((r) => ({
        title: r.problem.title,
        id: r.problem.id,
        difficulty: r.problem.difficulty,
      }))

      try {
        await sendRevisionReminder(user.email, user.name || "there", problems)
        emailsSent++
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      usersNotified: emailsSent,
      totalRevisions: dueRevisions.length,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get("secret")
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return POST(request)
}


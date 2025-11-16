import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") || "all"

    const where: any = {
      userId: session.user.id,
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    if (filter === "today") {
      where.nextDate = {
        lte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    } else if (filter === "week") {
      where.nextDate = {
        gte: today,
        lte: weekFromNow,
      }
    } else if (filter === "overdue") {
      where.nextDate = {
        lt: today,
      }
    }

    const revisions = await prisma.revision.findMany({
      where,
      include: {
        problem: {
          include: {
            repo: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { nextDate: "asc" },
    })

    return NextResponse.json(revisions)
  } catch (error) {
    console.error("Failed to fetch revisions:", error)
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { problemId } = await request.json()
    
    if (!problemId) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 })
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { repo: true },
    })

    if (!problem || problem.repo.userId !== session.user.id) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 })
    }

    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 7)

    const revision = await prisma.revision.upsert({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId,
        },
      },
      update: {
        nextDate,
        intervalDays: 7,
      },
      create: {
        userId: session.user.id,
        problemId,
        nextDate,
        intervalDays: 7,
      },
    })

    return NextResponse.json(revision)
  } catch (error) {
    console.error("Failed to create revision:", error)
    return NextResponse.json({ error: "Failed to create revision" }, { status: 500 })
  }
}


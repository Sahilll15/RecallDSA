import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const revision = await prisma.revision.findUnique({
      where: { id: params.id },
    })

    if (!revision || revision.userId !== session.user.id) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 })
    }

    const newIntervalDays = revision.intervalDays * 2
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + newIntervalDays)

    const updated = await prisma.revision.update({
      where: { id: params.id },
      data: {
        lastRevised: new Date(),
        intervalDays: newIntervalDays,
        nextDate,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to complete revision:", error)
    return NextResponse.json({ error: "Failed to complete revision" }, { status: 500 })
  }
}


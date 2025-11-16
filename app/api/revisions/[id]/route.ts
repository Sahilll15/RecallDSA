import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
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

    await prisma.revision.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete revision:", error)
    return NextResponse.json({ error: "Failed to delete revision" }, { status: 500 })
  }
}


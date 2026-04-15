import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'

function pad(n: number) { return String(n).padStart(2, '0') }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
}

export async function GET(_: Request, { params }: { params: { meetingId: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meeting = await prisma.meeting.findUnique({
    where: { id: params.meetingId },
    include: { project: true, attendees: { include: { user: true } } },
  })
  if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const start = meeting.scheduledAt ?? new Date()
  const end = new Date(start.getTime() + meeting.duration * 60000)
  const attendeeLines = meeting.attendees
    .map(a => `ATTENDEE;CN=${a.user.name}:mailto:${a.user.email}`)
    .join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI项目管理平台//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@pmhub`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:${meeting.agenda.replace(/\n/g, '\\n')}`,
    `LOCATION:${meeting.location || meeting.project.name}`,
    attendeeLines,
    `ORGANIZER;CN=${meeting.project.name}:mailto:noreply@pmhub`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="meeting-${meeting.id}.ics"`,
    },
  })
}

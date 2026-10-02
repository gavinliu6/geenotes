import { cn } from '@/lib/utils'
import { getFirstName } from '@/utils/account'

interface GreetingProps {
  name: string
  now: Date
  timeZone: string
  className?: string
}

export function Greeting({ name, now, timeZone, className }: GreetingProps) {
  const { emoji, text } = getGreeting(now, timeZone)
  const firstName = getFirstName(name)

  return (
    <h1
      className={cn(
        `
          font-serif text-3xl font-light tracking-tight
          md:text-4xl
        `,
        className
      )}
    >
      <span aria-hidden="true" className="mr-3">{emoji}</span>
      {firstName ? `${text}, ${firstName}` : text}
    </h1>
  )
}

function getGreeting(date: Date, timeZone: string) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' })
      .formatToParts(date)
      .find(part => part.type === 'hour')?.value
  )

  if (hour >= 5 && hour < 12) return { emoji: '☀️', text: 'Good morning' }
  if (hour >= 12 && hour < 18) return { emoji: '⛅', text: 'Good afternoon' }

  return { emoji: '🌙', text: 'Good evening' }
}

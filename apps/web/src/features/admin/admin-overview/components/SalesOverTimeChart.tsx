import { useId } from 'react'
import { formatDate, formatMoney } from '@/services/format'
import type { AdminSalesPoint } from '../admin-overview.types'

interface SalesOverTimeChartProps {
  points: AdminSalesPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 96
const BAR_GAP = 6

function fullDay(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatDate(`${date}T12:00:00`) : formatDate(date)
}

function dayNumber(date: string): string {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(date)
  return match ? date.slice(8, 10) : date
}

export function SalesOverTimeChart({ points }: SalesOverTimeChartProps) {
  const headingId = useId()
  const chartTitleId = useId()
  const chartDescId = useId()

  const total = points.reduce((sum, point) => sum + point.total, 0)
  const best = points.reduce<AdminSalesPoint | null>(
    (highest, point) =>
      highest === null || point.total > highest.total ? point : highest,
    null,
  )
  const max = Math.max(...points.map((point) => point.total), 0)
  const hasSales = points.length > 0 && total > 0
  const barWidth =
    points.length > 0 ? (CHART_WIDTH - BAR_GAP * (points.length - 1)) / points.length : 0

  const summary = hasSales
    ? `Sales for the last seven days: ${formatMoney(total)} in total. Best day: ${
        best ? `${fullDay(best.date)}, ${formatMoney(best.total)}` : 'none'
      }.`
    : 'No sales in the last seven days.'

  return (
    <section aria-labelledby={headingId} className="rounded-xl border bg-card p-4 md:p-6">
      <div className="space-y-1">
        <h2 id={headingId} className="text-xl md:text-2xl">
          Sales over time
        </h2>
        <p className="text-sm text-muted-foreground">Revenue per day for the last 7 days.</p>
      </div>

      {hasSales ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            <data value={total} className="font-medium text-foreground tabular">
              {formatMoney(total)}
            </data>{' '}
            in total
            {best && (
              <>
                {' '}
                · best day{' '}
                <time dateTime={best.date} className="text-foreground">
                  {fullDay(best.date)}
                </time>{' '}
                with{' '}
                <data value={best.total} className="font-medium text-foreground tabular">
                  {formatMoney(best.total)}
                </data>
              </>
            )}
          </p>

          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="mt-4 h-28 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-labelledby={`${chartTitleId} ${chartDescId}`}
          >
            <title id={chartTitleId}>Daily sales for the last seven days</title>
            <desc id={chartDescId}>{summary}</desc>
            <line
              x1={0}
              y1={CHART_HEIGHT}
              x2={CHART_WIDTH}
              y2={CHART_HEIGHT}
              stroke="currentColor"
              strokeWidth={1}
              className="text-border"
            />
            {points.map((point, index) => {
              const height = max > 0 ? (point.total / max) * CHART_HEIGHT : 0
              return (
                <rect
                  key={point.date}
                  x={index * (barWidth + BAR_GAP)}
                  y={CHART_HEIGHT - height}
                  width={barWidth}
                  height={height}
                  fill="currentColor"
                  className="text-primary"
                >
                  <title>{`${fullDay(point.date)}: ${formatMoney(point.total)}`}</title>
                </rect>
              )
            })}
          </svg>

          <div aria-hidden="true" className="mt-2 flex gap-1.5">
            {points.map((point) => (
              <span
                key={point.date}
                className="flex-1 text-center text-xs text-muted-foreground tabular"
              >
                {dayNumber(point.date)}
              </span>
            ))}
          </div>

          <table className="sr-only">
            <caption>Daily sales for the last seven days</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Sales</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date}>
                  <th scope="row">{fullDay(point.date)}</th>
                  <td>{formatMoney(point.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="py-10 text-sm text-muted-foreground">
          No sales in the last 7 days yet. Sales appear here after buyers check out.
        </p>
      )}
    </section>
  )
}

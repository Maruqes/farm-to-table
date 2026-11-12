import { useId } from 'react'
import { formatDate, formatMoney } from '@/services/format'
import type { DashboardSalesPoint } from '../producer-dashboard.types'

interface SalesOverTimeChartProps {
  points: DashboardSalesPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 96
const BAR_GAP = 6

function fullDay(day: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? formatDate(`${day}T12:00:00`) : formatDate(day)
}

function dayNumber(day: string): string {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(day)
  return match ? day.slice(8, 10) : day
}

export function SalesOverTimeChart({ points }: SalesOverTimeChartProps) {
  const headingId = useId()
  const chartTitleId = useId()
  const chartDescId = useId()

  const total = points.reduce((sum, point) => sum + point.total, 0)
  const best = points.reduce<DashboardSalesPoint | null>(
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
        best ? `${fullDay(best.day)}, ${formatMoney(best.total)}` : 'none'
      }.`
    : 'No sales in the last seven days.'

  return (
    <section aria-labelledby={headingId} className="vstack gap-3">
      <div className="vstack gap-1">
        <h2 id={headingId}>Sales over time</h2>
        <p className="small text-body-secondary">Revenue for the last 7 days.</p>
      </div>

      <div className="rule pt-4">
        {hasSales ? (
          <>
            <p className="small text-body-secondary">
              <data value={total} className="fw-semibold tabular">
                {formatMoney(total)}
              </data>{' '}
              in total
              {best && (
                <>
                  {' '}
                  · best day{' '}
                  <time dateTime={best.day}>{fullDay(best.day)}</time> with{' '}
                  <data value={best.total} className="fw-semibold tabular">
                    {formatMoney(best.total)}
                  </data>
                </>
              )}
            </p>

            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="pa-chart-svg mt-4 w-100"
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
                className="pa-chart-axis"
              />
              {points.map((point, index) => {
                const height = max > 0 ? (point.total / max) * CHART_HEIGHT : 0
                return (
                  <rect
                    key={point.day}
                    x={index * (barWidth + BAR_GAP)}
                    y={CHART_HEIGHT - height}
                    width={barWidth}
                    height={height}
                    fill="currentColor"
                  >
                    <title>{`${fullDay(point.day)}: ${formatMoney(point.total)}`}</title>
                  </rect>
                )
              })}
            </svg>

            <div aria-hidden="true" className="d-flex gap-2 mt-2">
              {points.map((point) => (
                <span key={point.day} className="pa-chart-day tabular">
                  {dayNumber(point.day)}
                </span>
              ))}
            </div>

            <table className="visually-hidden">
              <caption>Daily sales for the last seven days</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Sales</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.day}>
                    <th scope="row">{fullDay(point.day)}</th>
                    <td>{formatMoney(point.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="py-5 small text-body-secondary">
            No sales in the last 7 days yet. Add products to the catalog to get your first
            order.
          </p>
        )}
      </div>
    </section>
  )
}

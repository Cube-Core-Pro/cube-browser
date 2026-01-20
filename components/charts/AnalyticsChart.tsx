'use client';

/**
 * AnalyticsChart Component
 * CUBE Elite v7 - Reusable Charts for Analytics & Dashboards
 * 
 * Uses recharts library for professional data visualizations.
 * Supports line, bar, area, and pie charts with full theming.
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AnalyticsChart');

// =============================================================================
// Types
// =============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  type?: 'monotone' | 'linear' | 'step';
}

export type ChartType = 'line' | 'bar' | 'area' | 'pie';

export interface AnalyticsChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  series?: ChartSeries[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  colors?: string[];
  xAxisKey?: string;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

// =============================================================================
// Custom Tooltip
// =============================================================================

interface CustomTooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, index) => {
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  series = [{ dataKey: 'value', name: 'Value' }],
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animate = true,
  colors = DEFAULT_COLORS,
  xAxisKey = 'name',
  className = '',
}) => {
  log.debug(`Rendering ${type} chart with ${data.length} data points`);

  // Memoize series with colors
  const coloredSeries = useMemo(() => {
    return series.map((s, index) => ({
      ...s,
      color: s.color || colors[index % colors.length],
    }));
  }, [series, colors]);

  // Common axis props
  const axisProps = {
    tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
    axisLine: { stroke: 'var(--border)' },
    tickLine: { stroke: 'var(--border)' },
  };

  // Render based on chart type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            )}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {coloredSeries.map((s) => (
              <Line
                key={s.dataKey}
                type={s.type || 'monotone'}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                dot={{ fill: s.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: s.color, strokeWidth: 2 }}
                animationDuration={animate ? 1000 : 0}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            )}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {coloredSeries.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                animationDuration={animate ? 1000 : 0}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            )}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {coloredSeries.map((s) => (
              <Area
                key={s.dataKey}
                type={s.type || 'monotone'}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.2}
                strokeWidth={2}
                animationDuration={animate ? 1000 : 0}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              animationDuration={animate ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}-${index}`}
                  fill={colors[index % colors.length]}
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        log.warn(`Unknown chart type: ${type}`);
        return null;
    }
  };

  return (
    <div className={`analytics-chart ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() || <div />}
      </ResponsiveContainer>
    </div>
  );
};

// =============================================================================
// Specialized Chart Components
// =============================================================================

interface TimeSeriesChartProps {
  data: Array<{ date: string; value: number; [key: string]: string | number }>;
  series?: ChartSeries[];
  title?: string;
  height?: number;
  className?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  series = [{ dataKey: 'value', name: 'Value' }],
  title,
  height = 300,
  className = '',
}) => {
  return (
    <AnalyticsChart
      type="area"
      data={data.map(d => ({ ...d, name: d.date }))}
      series={series}
      title={title}
      height={height}
      xAxisKey="name"
      className={className}
    />
  );
};

interface DistributionChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: number;
  colors?: string[];
  className?: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  title,
  height = 300,
  colors,
  className = '',
}) => {
  return (
    <AnalyticsChart
      type="pie"
      data={data}
      title={title}
      height={height}
      colors={colors}
      className={className}
    />
  );
};

interface ComparisonChartProps {
  data: ChartDataPoint[];
  series: ChartSeries[];
  title?: string;
  height?: number;
  className?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  series,
  title,
  height = 300,
  className = '',
}) => {
  return (
    <AnalyticsChart
      type="bar"
      data={data}
      series={series}
      title={title}
      height={height}
      className={className}
    />
  );
};

// =============================================================================
// Export
// =============================================================================

export default AnalyticsChart;

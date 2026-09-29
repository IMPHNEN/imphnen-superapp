import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type TSessionStatusSlice = {
  name: string;
  value: number;
};

const SLICE_COLORS = ['#23A1EB', '#81CBF8', '#BCE1FB', '#0877C1', '#5AB4F0'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: any) => {
  const cx = props.cx ?? 0;
  const cy = props.cy ?? 0;
  const midAngle = props.midAngle ?? 0;
  const innerRadius = props.innerRadius ?? 0;
  const outerRadius = props.outerRadius ?? 0;
  const percent = props.percent ?? 0;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

type TSessionStatusChartProps = {
  data: readonly TSessionStatusSlice[];
};

export const SessionStatusChart = ({ data }: TSessionStatusChartProps) => {
  const chartData = data.filter((slice) => slice.value > 0);
  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        Belum ada data
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart width={500} height={320}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={100}
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={SLICE_COLORS[index % SLICE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

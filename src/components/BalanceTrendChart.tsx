import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
    date: string;
    amount: number;
}

interface BalanceTrendChartProps {
    data: TrendData[];
}

export function BalanceTrendChart({ data }: BalanceTrendChartProps) {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#52525B"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#52525B"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', border: '1px solid #27272A', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#FFFFFF" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

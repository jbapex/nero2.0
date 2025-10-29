import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const formatNumberForChart = (value) => {
  if (typeof value !== 'number') {
    return value;
  }
  return new Intl.NumberFormat('pt-BR').format(value);
};


const Charts = ({ chartData }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="w-6 h-6 mr-3 text-primary" />
            Visão Geral da Performance
          </CardTitle>
          <CardDescription>Sem dados para exibir o gráfico.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Aguardando análise para gerar gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.valor));

  const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
  ];

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart2 className="w-5 h-5 mr-3 text-primary" />
          Visão Geral da Performance
        </CardTitle>
        <CardDescription>Principais métricas da campanha em um relance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-4">
          {chartData.map((item, index) => (
            <div key={item.metrica} className="flex items-center group">
              <span className="w-1/4 text-sm font-medium text-muted-foreground">{item.metrica}</span>
              <div className="w-3/4 bg-muted rounded-full h-8 flex items-center pr-3">
                <motion.div
                  className={`h-8 rounded-full ${colors[index % colors.length]} flex items-center justify-end px-3 transition-all duration-300 group-hover:shadow-lg group-hover:brightness-110`}
                  style={{ width: `${(item.valor / Math.max(maxValue, 1)) * 100}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.valor / Math.max(maxValue, 1)) * 100}%`}}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                >
                    <span className="text-sm font-bold text-white text-shadow">
                       {formatNumberForChart(item.valor)}
                    </span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Charts;
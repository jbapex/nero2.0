import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Target, TrendingUp, MousePointerClick, Eye, Percent, ChevronsRight } from 'lucide-react';

const kpiConfig = [
  { key: 'Investimento Total', title: 'Investimento', icon: DollarSign, prefix: 'R$ ', color: 'text-blue-500', isCurrency: true },
  { key: 'ROAS', title: 'ROAS', icon: TrendingUp, suffix: 'x', color: 'text-green-500' },
  { key: 'CPA Médio', title: 'CPA Médio', icon: Target, prefix: 'R$ ', color: 'text-red-500', isCurrency: true },
  { key: 'CTR Médio', title: 'CTR Médio', icon: MousePointerClick, suffix: '%', color: 'text-purple-500' },
  { key: 'CPM Médio', title: 'CPM Médio', icon: Eye, prefix: 'R$ ', color: 'text-orange-500', isCurrency: true },
  { key: 'CPC Médio', title: 'CPC Médio', icon: ChevronsRight, prefix: 'R$ ', color: 'text-teal-500', isCurrency: true },
  { key: 'Taxa de Conversão', title: 'Taxa de Conversão', icon: Percent, suffix: '%', color: 'text-pink-500' },
];

const formatNumber = (value, isCurrency = false) => {
    if (typeof value !== 'number') {
        return value;
    }
    const options = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (isCurrency) {
        // The prefix "R$" is handled by the component to avoid duplication
        return new Intl.NumberFormat('pt-BR', options).format(value);
    }
    return value.toFixed(2);
};


const KPICards = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {kpiConfig.map((item, index) => {
        const Icon = item.icon;
        const value = kpis[item.key];
        
        if (value === undefined || value === null) return null;

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Card className="text-center h-full hover:bg-muted/50 transition-colors duration-200">
              <CardHeader className="pb-2">
                <Icon className={`mx-auto h-6 w-6 mb-2 ${item.color}`} />
                <CardTitle className="text-xs font-bold text-muted-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xl font-bold">
                  {item.prefix || ''}
                  {formatNumber(value, item.isCurrency)}
                  {item.suffix || ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default KPICards;
import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, FileText, Repeat, Download, ListChecks, ShieldAlert, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KPICards from './KPICards';
import Charts from './Charts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const SectionCard = ({ icon, title, content, variant = 'default', isList = false }) => {
  const Icon = icon;
  const colors = {
    default: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  const renderContent = () => {
    if (isList && Array.isArray(content)) {
      return (
        <ul className="list-disc pl-5 space-y-2 text-sm">
          {content.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      );
    }
    return <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{content}</div>;
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className={`flex items-center text-base font-semibold ${colors[variant]}`}>
          <Icon className="w-5 h-5 mr-3" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

const AnalysisResults = ({ data, onNewAnalysis }) => {
  const reportRef = React.useRef();

  if (!data) {
    return (
      <div className="text-center p-8">
        <p>Nenhum resultado para exibir. Por favor, inicie uma nova análise.</p>
        <Button onClick={onNewAnalysis} className="mt-4">Nova Análise</Button>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    const input = reportRef.current;
    html2canvas(input, { scale: 2, backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      let imgHeight = pdfWidth / ratio;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`relatorio-analise-${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };
  
  const { kpis, resumo_executivo, diagnostico, oportunidades, pontos_de_atencao, plano_de_acao, chartData } = data;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold">Resultados da Análise de IA</h2>
            <p className="text-muted-foreground">Relatório gerado pelo Gestor de Tráfego Inteligente.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={onNewAnalysis} variant="outline">
              <Repeat className="mr-2 h-4 w-4" /> Nova Análise
            </Button>
            <Button onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> Baixar PDF
            </Button>
        </div>
      </div>
      
      <div ref={reportRef} className="space-y-6 bg-input p-4 md:p-6 rounded-lg">
        
        <Charts chartData={chartData} />
        
        <KPICards kpis={kpis} />
        
        <div className="grid grid-cols-1 gap-6">
            <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
                <SectionCard icon={BookOpen} title="Resumo Executivo" content={resumo_executivo || "Não foi gerado um resumo executivo."} />
                <SectionCard icon={FileText} title="Diagnóstico Detalhado da Campanha" content={diagnostico} />
                <SectionCard icon={ShieldAlert} title="Pontos de Atenção Críticos" content={pontos_de_atencao || []} isList={true} variant="danger" />
                <SectionCard icon={Lightbulb} title="Oportunidades de Otimização" content={oportunidades || []} isList={true} variant="success" />
                <SectionCard 
                    icon={ListChecks} 
                    title="Plano de Ação Sugerido" 
                    content={plano_de_acao || "Nenhum plano de ação foi gerado."} 
                    isList={Array.isArray(plano_de_acao)}
                    variant="default" 
                />
            </motion.div>
        </div>
      </div>

    </motion.div>
  );
};

export default AnalysisResults;
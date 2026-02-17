import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-6xl font-bold text-primary mb-2">{t('errors.notFoundTitle')}</h1>
      <p className="text-xl text-foreground mb-1">{t('errors.notFound')}</p>
      <p className="text-muted-foreground mb-6">{t('errors.notFoundMessage')}</p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Home className="w-4 h-4" />
        {t('errors.backToDashboard')}
      </Link>
    </div>
  );
}

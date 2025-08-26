
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 max-w-lg mx-auto">
        <h1 className="text-5xl font-bold text-primary mb-4">
          Bem-vindo ao DfD Kanban
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Organize suas tarefas, defina suas metas e planeje sua semana, tudo em um só lugar com o poder da IA.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">Criar Conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

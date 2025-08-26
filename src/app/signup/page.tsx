
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não coincidem.',
      });
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Cadastro bem-sucedido!',
        description: 'Sua conta foi criada. Você já pode fazer o login.',
      });
      router.push('/login');
    } catch (error: any) {
      let description = `Ocorreu um erro desconhecido. Código: ${error.code}`;
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = 'Este email já está em uso.';
          break;
        case 'auth/invalid-email':
          description = 'O formato do email é inválido.';
          break;
        case 'auth/weak-password':
          description = 'A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          description = 'Erro de rede. Verifique sua conexão com a internet.';
          break;
        case 'auth/invalid-credential':
          description = 'Credenciais inválidas. Verifique seu email e senha.';
          break;
      }
      toast({
        variant: 'destructive',
        title: 'Erro no Cadastro',
        description,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>Crie sua conta para começar a usar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Criar Conta
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

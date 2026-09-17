'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/error-message';
import { Button } from '@/components/ui/button';

// 비밀번호 규칙은 백엔드 SignupRequest(@Size(min=6, max=64))와 맞춘다(shrimp-rules §5.2).
const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('이메일 형식이 올바르지 않습니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push(searchParams.get('redirect') || '/');
    } catch (e) {
      // 백엔드가 잘못된 이메일/비밀번호를 구분하지 않고 동일한 메시지로 응답한다(shrimp-rules §5.1).
      setServerError(getErrorMessage(e));
    }
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  return (
    <>
      <h1 className="text-xl font-semibold">로그인</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-destructive text-xs">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-destructive text-xs">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-destructive text-sm">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      {apiBaseUrl && (
        <a
          href={`${apiBaseUrl}/oauth2/authorization/google`}
          className="border-input bg-background hover:bg-muted flex h-9 items-center justify-center rounded-md border text-sm transition-colors"
        >
          Google로 로그인
        </a>
      )}

      <p className="text-muted-foreground text-center text-sm">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  // useSearchParams는 Suspense 경계가 필요하다(Next.js App Router 요구사항).
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

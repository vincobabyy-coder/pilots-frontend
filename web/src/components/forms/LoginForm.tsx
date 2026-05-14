import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  error?: string;
}

export function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const submit = async (data: FormData) => {
    setLoading(true);
    try { await onSubmit(data); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Input
        label="Email address"
        type="email"
        icon="mail"
        placeholder="dispatcher@company.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          icon="lock"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showPw ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </p>
      )}

      <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
        Sign in to PILOTS
      </Button>
    </form>
  );
}

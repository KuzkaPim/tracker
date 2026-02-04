'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { authService } from '@/views/auth/services/auth';
import { RegisterDto } from '@/views/auth/types';

export const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterDto>();

  const onSubmit = async (data: RegisterDto) => {
    setError(null);
    try {
      if (isLogin) {
        await authService.login({ email: data.email, password: data.password });
      } else {
        const { confirmPassword: _, ...registerData } = data;
        
        if (!registerData.companyDomain) {
          delete registerData.companyDomain;
        }
        
        await authService.register(registerData);
      }
      
      router.push('/dashboard'); 
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Что-то пошло не так');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? 'Вход в Hubnity' : 'Регистрация компании'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">ФИО</label>
                <input 
                  {...register('name', { required: 'Введите имя' })} 
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Иван Иванов"
                />
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Название компании</label>
                <input 
                  {...register('companyName', { required: 'Название компании обязательно' })} 
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Моя Компания"
                />
                {errors.companyName && <span className="text-xs text-red-500">{errors.companyName.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Домен компании (необязательно)</label>
                <input 
                  {...register('companyDomain')} 
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="my-company"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              {...register('email', { required: 'Email обязателен' })} 
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <input 
              type="password" 
              {...register('password', { 
                required: 'Пароль обязателен',
                minLength: { value: 8, message: 'Минимум 8 символов' }
              })} 
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Подтвердите пароль</label>
              <input 
                type="password" 
                {...register('confirmPassword', { 
                  required: 'Подтверждение обязательно',
                  validate: (val) => {
                    if (watch('password') != val) {
                      return "Пароли не совпадают";
                    }
                  }
                })} 
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isSubmitting ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }} 
            className="text-blue-600 hover:underline font-medium"
          >
            {isLogin ? 'Создать компанию и аккаунт' : 'У меня уже есть аккаунт'}
          </button>
        </div>
      </div>
    </div>
  );
}


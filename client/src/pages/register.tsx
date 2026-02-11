import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { registerSchema, KOREAN_BANKS } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { SamsungLogo, SamsungBadge } from "@/components/samsung-logo";
import { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      accountNumber: "",
      accountHolder: "",
      bank: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "회원가입 완료",
        description: "로그인 페이지로 이동합니다",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "회원가입 실패",
        description: error.message.includes("409") ? "이미 존재하는 아이디입니다" : "오류가 발생했습니다",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" /> 홈으로
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <SamsungBadge size={36} />
            <SamsungLogo className="h-5 w-auto text-[#004B9C]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">회원가입</h1>
          <p className="text-sm text-muted-foreground mt-1">IBK기업 주식관리 시스템</p>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>아이디</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="아이디를 입력하세요 (4자 이상)"
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="비밀번호를 입력하세요 (6자 이상)"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>성명</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="성명을 입력하세요"
                        data-testid="input-fullname"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>은행</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bank">
                          <SelectValue placeholder="은행을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KOREAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank} data-testid={`option-bank-${bank}`}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>계좌번호</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="계좌번호를 입력하세요"
                        data-testid="input-account-number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>예금주</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="예금주를 입력하세요"
                        data-testid="input-account-holder"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "가입 중..." : "회원가입"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-medium" data-testid="link-login">
              로그인
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

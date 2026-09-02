"use client"

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import Link from 'next/link'
import { useState } from 'react'

// Form schema
const formSchema = z.object({
  email: z.string().min(2, {
    message: "email must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters."
  })
})

const LoginForm = () => {
  const [message, setMessage] = useState();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // onSubmit function that sends Post request
  async function onSubmit(values: z.infer<typeof formSchema>) {
    
    const response  = await fetch('http://localhost:8000/api/login/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(values)
  });

  if(!response.ok) {
    const errorData = await response.json();
        setMessage(errorData.message || 'Incorrect Details. Please try again.');
        return;
  }
    await router.push('/home');
  }

  return (
    
        <Card>
    <CardHeader>
      <CardTitle><h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      Log in
    </h3></CardTitle>
      <CardDescription>Enter your email and password below to login to your account</CardDescription>
    </CardHeader>
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {message && <p className="text-red-500">{message}</p>}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel> <small className="text-sm font-semibold leading-none">Email</small></FormLabel>
              <FormControl>
                <Input placeholder="x@example.com" {...field} />
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
              <FormLabel className='flex justify-between'> <small className="text-sm font-semibold leading-none">Password</small>
              <Link href={'/register'}><p className=''>Forgot password?</p></Link>
              </FormLabel>
              <FormControl>
                <Input type='password'{...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <Button type='submit' className='w-full'>Log in</Button>
        </form>


      </Form>
      
    </CardContent>
    <CardFooter className='flex justify-center'>
      <p className='text-center'>Don&apos;t have an account?</p> <Link href={"/register"}><p className='underline'> Sign up</p></Link>
    </CardFooter>
  </Card>

      
   
  )
}

export default LoginForm

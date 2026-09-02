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



const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters."
  }),
  email: z.string().min(2, {
    message: "email must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters."
  })
})

const RegisterForm = () => {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
      },
    })
    
// onSubmit function that sends Post request
    async function onSubmit(values: z.infer<typeof formSchema>) {
    
        await fetch('http://localhost:8000/api/register/', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(values)
      });
    
        await router.push('/login');
      }

  return (
    <Card>
    <CardHeader>
      <CardTitle><h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      Sign Up
    </h3></CardTitle>
      <CardDescription>Enter your details below to create an account.</CardDescription>
    </CardHeader>
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel> <small className="text-sm font-semibold leading-none">Name</small></FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
              </FormLabel>
              <FormControl>
                <Input type='password'{...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <Button type='submit' className='w-full'>Sign up</Button>
        </form>


      </Form>
      
    </CardContent>
    <CardFooter className='flex justify-center'>
      <p className='text-center'>Already have an account?</p> <Link href={"/login"}><p className='underline'> Log in</p></Link>
    </CardFooter>
  </Card>
  )
}

export default RegisterForm

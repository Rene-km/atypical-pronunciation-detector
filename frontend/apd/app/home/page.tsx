'use client'

import { useState, useEffect } from "react";
import { getPhrases, getUser } from '@/my-api'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from 'next/image'
import Link from 'next/link'



const Page = () => {

  const [easy, setEasy] = useState<[number, number] | null>(null);
  const [medium, setMedium] = useState<[number, number] | null>();
  const [hard, setHard] = useState<[number, number] | null>();


  const getUserQuery = useQuery({
    queryKey: ['user'],
    queryFn: getUser
  })

  const { data } = useQuery({
    queryKey: ['phrases'],
    queryFn: getPhrases
  })

  const progress = () => {
    const total = data?.phrases.length;
    let completed = 0;
    for(let i = 0; i < total!; i++) {
        if(data?.phrases[i].completed == true) {
          completed += 1
        }
    }

    return [completed,(completed!/total!) *100]
  }

  const levelProgress = (level: number): [number, number] | undefined => {
    const modulePhrases = data?.phrases.filter((phrase) => phrase.module == level);
    if (!modulePhrases) return undefined;
    
    let completed = 0;
    for(let i = 0; i < modulePhrases.length; i++) {
      if(modulePhrases[i].completed == true) {
        completed += 1;
      }
    }
    return [completed, modulePhrases.length];
  }
 

useEffect(() => {
   setEasy(levelProgress(1) || null);
   setMedium(levelProgress(2) || null);
   setHard(levelProgress(3) || null);
}, [data]); 
 

   
  return (
   
    <div className='container mx-auto pt-8'>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {getUserQuery.data?.name ? `Hello ${getUserQuery.data?.name}` : 'Hello!' }</h1>
      <div className='flex justify-end'>
      <Card className=''>
  <CardHeader>
    <CardTitle>Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <div className='flex justify-between gap-11'>
  <div className="radial-progress" style={{ "--value": progress()[1] } as React.CSSProperties} role="progressbar">
   
  {data ? progress()[0] : '1'}
</div>
<div className='pr-4'>
      <div className='flex gap-11 justify-between'><p className='text-emerald-500'>Easy </p> <p className=''>{easy && easy[0]}/{easy && easy[1]}</p></div>
      <div className='flex gap-11 justify-between'><p className='text-amber-500'>Medium </p> <p className=''>{medium && medium[0]}/{medium && medium[1]}</p></div>
      <div className='flex gap-11 justify-between'><p className='text-rose-500'>Hard </p> <p className=''>{hard && hard[0]}/{hard && hard[1]}</p></div>
    </div>
</div>
  </CardContent>
 

</Card>


    </div>
<div className='flex  justify-between mt-24'>
  
  <div className="flex flex-col items-center gap-5">
    <Link href={'/home/1'}>
      <Image
        src={'/easy_pic.png'}
        width={350}
        height={350}
        alt="Photo for blog"
        className='mx-auto rounded border shadow-md'
      />
    </Link>
    <h4  className="scroll-m-20 text-xl font-semibold tracking-tight"> Easy</h4>
    </div>

    <div className="flex flex-col items-center gap-5">
    <Link href={'/home/2'} className="block">
      <Image
        src={'/med_pic.png'}
        width={350}
        height={350}
        alt="Photo for blog"
        className='mx-auto rounded border shadow-md'
      />
    </Link>
    <h4  className="scroll-m-20 text-xl font-semibold tracking-tight"> Medium</h4>
    </div>

    <div className="flex flex-col items-center gap-5">
    <Link href={'/home/3'} className="block">
      <Image
        src={'/hard_pic.png'}
        width={350}
        height={350}
        alt="Photo for blog"
        className='mx-auto rounded border shadow-md'
      />
    </Link>
    <h4  className="scroll-m-20 text-xl font-semibold tracking-tight"> Hard</h4>
    </div>
</div>
   </div>
  )
}

export default Page

'use client'

import React from 'react'
import {
    useQuery,
  } from '@tanstack/react-query'
import { columns } from './columns'
import { DataTable } from "./data-table"
import { getPhrases } from '@/my-api'
import { useParams } from 'next/navigation'
import { Phrase } from './columns'



const Data = () => {

  const params = useParams<{ level: string; }>()
  const level = Number(params.level)

  function checkLevel(phrase: Phrase) {
    return phrase.module == level;
  }
  
  const { data } = useQuery({
    queryKey: ['phrases'],
    queryFn: getPhrases
  })
  if (!data) return null;
  return (
    <div>
     <DataTable columns={columns} data={data.phrases.filter(checkLevel)} />
    </div>
  )
}

export default Data

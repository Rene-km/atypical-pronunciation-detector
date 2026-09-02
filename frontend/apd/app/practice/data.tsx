'use client'

import React from 'react'
import {
    useQuery,
  } from '@tanstack/react-query'
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { getPhrases } from '@/my-api'



const Data = () => {
  
  const { data } = useQuery({
    queryKey: ['phrases'],
    queryFn: getPhrases
  })
  if (!data) return null;
  return (
    <div>
     <DataTable columns={columns} data={data.phrases} />
    </div>
  )
}

export default Data

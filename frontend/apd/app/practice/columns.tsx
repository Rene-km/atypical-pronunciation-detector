'use client'

import { ColumnDef } from "@tanstack/react-table"
import { CircleCheckBig } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import Link from "next/link";




export type Phrase = {
    id: number,
    phrase: string,
    module: number,  // 1 = easy, 2 = medium, 3 = hard
    audio: string,
    completed: boolean
  
}

export const columns: ColumnDef<Phrase>[] = [
  {
    accessorKey: "completed",
    header: "Status",
    cell: ({row}) => {
      if(!row.getValue("completed")) {
        return <div></div>
      } else {
        return <CircleCheckBig />
      }
    }
  },
  {
    accessorKey: "phrase",
    header: "Phrase",
    cell: ({row}) => {
      const phrase: string = row.getValue("phrase")
      const id: number = row.original.id  // Access the full row data
      return <Link 
        href={`/practice/${id}`}
        className="text-lg"
      >
        {phrase}
      </Link>
    }
  },
  {
    accessorKey: "module",
    header: "Difficulty",
    cell: ({row}) => {
      const status: number = row.getValue("module")

      if(status === 1) {
        return <Badge className="bg-green-900">Easy</Badge>;
      }

      if(status === 2) {
        return <Badge className="bg-orange-600">Medium</Badge>;
      }

      if(status === 3) {
        return <Badge className="bg-red-600">Hard</Badge>;
      }
    }
  },
]




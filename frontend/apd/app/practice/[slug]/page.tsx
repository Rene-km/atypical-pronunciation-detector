'use client'

import { Mic, Square, Volume2 } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPhrase, answerPost, getAnswer, updateProgress } from '@/my-api';
import { useParams } from 'next/navigation'

interface ComparisonResult {
  native_word: string;
  learner_word: string;
  similarity: number;
}


function getFeedbackLevel(similarity: number): string {
  if (similarity >= 80) return "Excellent!";
  if (similarity >= 60) return "Good";
  if (similarity >= 40) return "Keep practicing";
  if (similarity > 0) return "Needs improvement";
  return "Word missing";
}

function getFeedbackColor(similarity: number): string {
  if (similarity >= 80) return "#4CAF50"; // Green
  if (similarity >= 60) return "#FFC107"; // Yellow
  if (similarity >= 40) return "#FF9800"; // Orange
  return "#F44336"; // Red
}
function cleanBase64String(base64String: string) {
  // Remove any whitespace or line breaks
  return base64String.replace(/\s+/g, '');
}



async function audioToBase64(audioFile: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error('Expected string result from FileReader'));
      }
    };
    reader.readAsDataURL(audioFile);
  });
}

const Page = () => {
  
  const params = useParams<{ slug: string; }>()
  const slug = params.slug
 

const [can_record, setCanRecord] = useState(false)
const [is_recording, setIsRecording] = useState(false)
const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
const chunksRef = useRef<Blob[]>([])
const [id, setId] = useState<number | undefined>()
const audioRef = useRef<HTMLAudioElement>(null);



const { data } = useQuery({
  queryKey: ['phrase', slug],
  queryFn: () => getPhrase(Number(slug))
})

const getAnswerQuery = useQuery({
  queryKey: ['answer', id],
  queryFn: async () => {
    if (id === undefined) {
      throw new Error('ID is undefined');
    }
    try {
      const answer = await getAnswer(Number(id));
      console.log('Fetched answer:', answer); // Debugging log
      if (!answer) {
        throw new Error('Fetched answer is undefined');
      }
      progressMutation.mutate({ slug: Number(slug) });
      return answer;
    } catch (error) {
      console.error('Error fetching answer:', error);
      throw error;
    }
  },
  enabled: id !== undefined, // Only run the query if id is defined
});

const progressMutation = useMutation({
  mutationFn: ({slug}: {slug: number}) => {
    return updateProgress(slug)
  },
})

// Add mutation for answerPost
const answerMutation = useMutation({
  mutationFn: async ({ id, audio }: { id: number, audio: string }) => {
    console.log('Sending request to answerPost with id:', id, 'and audio length:', audio.length);
    return answerPost(id, audio);
  },
  onSuccess: (data) => {
   
    // Safely set the ID from the mutation result
    setId(data.id);
  },
  onError: (error) => {
    console.error('Mutation failed:', error);
  }
});



const setupStream = function(stream: MediaStream) {
   const newRecorder = new MediaRecorder(stream, {
     mimeType: 'audio/webm'  // Use WebM format for recording
   });

  newRecorder.ondataavailable = e => {
    if (e.data.size > 0) {
      console.log('Data available:', e.data.size);
      chunksRef.current.push(e.data);
    }
  }

  newRecorder.onstop = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Final chunks length:', chunksRef.current.length);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    
    // Convert to WAV format
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const audioData = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(audioData);
    
    // Create WAV file
    const wavBuffer = audioBufferToWav(audioBuffer);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    
    if (wavBlob.size > 0) {
      const response = await audioToBase64(wavBlob) as string;
      const base64Audio = cleanBase64String(response);
      console.log('WAV size:', wavBlob.size);
      // Submit the audio using mutation
      answerMutation.mutate({id: Number(slug), audio: base64Audio});
    } else {
      console.error('Created WAV blob is empty!');
    }
    chunksRef.current = [];
  }
  
  setRecorder(newRecorder)
  setCanRecord(true)
};

function createWriter(view: DataView) {
  let offset = 0;
  return {
    string: (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset++, str.charCodeAt(i));
      }
    },
    uint32: (data: number) => {
      view.setUint32(offset, data, true);
      offset += 4;
    },
    uint16: (data: number) => {
      view.setUint16(offset, data, true);
      offset += 2;
    }
  };
}

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer: AudioBuffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const bytesPerSample = 2;
  const bytesPerSecond = sampleRate * numChannels * bytesPerSample;
  const dataLength = buffer.length * numChannels * bytesPerSample;
  const headerLength = 44;
  const fileLength = dataLength + headerLength;
  const bufferData = new Uint8Array(fileLength);
  const dataView = new DataView(bufferData.buffer);
  const writer = createWriter(dataView);

  // HEADER
  writer.string("RIFF");
  writer.uint32(fileLength - 8); // File Size
  writer.string("WAVE");

  writer.string("fmt ");
  writer.uint32(16); // Chunk Size
  writer.uint16(1);  // Format Tag
  writer.uint16(numChannels); // Number Channels
  writer.uint32(sampleRate);  // Sample Rate
  writer.uint32(bytesPerSecond); // Bytes Per Second
  writer.uint16(numChannels * bytesPerSample); // Bytes Per Sample
  writer.uint16(bytesPerSample * 8); // Bits Per Sample
  writer.string("data");
  writer.uint32(dataLength);

  // Write interleaved audio data
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let pos = 0;
  while (pos < buffer.length) {
    for (let i = 0; i < numChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][pos]));
      const intSample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      dataView.setInt16(headerLength + pos * numChannels * bytesPerSample + i * bytesPerSample, intSample, true);
    }
    pos++;
  }

  return bufferData.buffer;
}

function toggleMic() {
  if(!can_record || !recorder) return;

  if(!is_recording) {
    chunksRef.current = [];
    recorder.start(1000); // Increased timeslice to 1 second
    console.log("Recording started");
   
  } else {
    console.log("Stopping recording...");
    console.log("Current chunks:", chunksRef.current.length);
    recorder.stop();
  }

  setIsRecording(!is_recording);
}

 

  function SetupAudio() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

    
    console.log("getUserMedia supported.");
    navigator.mediaDevices
      .getUserMedia(
        // constraints - only audio needed for this app
        {
          audio: true,
        },
      )
  
      // Success callback
      .then(setupStream)
  
      // Error callback
      .catch((err) => {
        console.error(`The following getUserMedia error occurred: ${err}`);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
}


 
useEffect(() => {
  console.log("Component has mounted!");
  SetupAudio();
},[]); // Empty dependency array ensures it runs only once

function playAudio() {
  if(audioRef.current) {
    audioRef.current.play();
  }
   
}

  
  return (
    <div className='container flex flex-auto self-center justify-center py-20'>
      <div className='flex flex-col justify-between items-center'>
      <div className='flex flex-auto'>
        {data && (
          <audio src={`http://localhost:8000/${data.audio}`} ref={audioRef}></audio>
        )}
        
      <Button variant="ghost" size="icon" className='rounded-full h-20 w-20' onClick={playAudio}>
      <Volume2 className='size-10' />
      </Button>
      <h1 className="pt-5 scroll-m-20 text-2xl font-semibold tracking-tight">{data ? data.phrase : 'Loading...'}</h1>
      </div>

      {getAnswerQuery.data?.comparison_results && (
              <div className="w-full mb-10">
                {getAnswerQuery.data.comparison_results.map((result: ComparisonResult, index: number) => (
                  <div key={index} className="feedback-item p-4 mb-2 rounded-lg bg-secondary">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{result.native_word}</span>
                      
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{color: getFeedbackColor(result.similarity)}}
                    >
                      {result.similarity}% - {getFeedbackLevel(result.similarity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

     
      

        <Button variant="outline" size="icon" className='rounded-full h-32 w-32'>
      <div className={is_recording ? 'hidden' : ''}>
      <Mic className='h-16 w-16' onClick={toggleMic}/>
      </div>
      <div className={!is_recording ? 'hidden' : ''}>
      <Square className='h-16 w-16' onClick={toggleMic}/>
      </div>
    </Button>
    </div>
    </div>
  )
}

export default Page



export type PhraseResponse = {
  phrases: [{
    id: number,
    phrase: string,
    module: number,  // 1 = easy, 2 = medium, 3 = hard
    audio: string,
    completed: boolean
}],
  score_easy: number,
  score_medium: number,
  score_hard: number
}

export const answerPost = async (id: number, audio: string) => {
  const response = await fetch("http://localhost:8000/api/answers/post/", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: id,
      audio_base64: audio
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
};

export async function getAnswer(id: number) {
    const url = `http://localhost:8000/api/answers/${id}/`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const json = await response.json();
        console.log(json);
        return json;
    } 

export async function getProgerss() {
    const url = `http://localhost:8000/api/get_progress/`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const json = await response.json();
        return json;
    } 


    export const updateProgress = async (id: number) => {
        const response = await fetch("http://localhost:8000/api/update_progress/", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phrase_id: id,
          }),
          credentials: 'include',
        });
      
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      
        return response.json();
      };


export const getPhrases = async (): Promise<PhraseResponse> => {
  const url = `http://localhost:8000/api/get_progress/`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if(!response.ok) throw new Error(`Error fetching data: ${response.status}`);
  return response.json();
}

export const getPhrase = async (id: number) => {
  const url = `http://localhost:8000/api/phrases/${id}/`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if(!response.ok) throw new Error(`Error fetching data: ${response.status}`);
  return response.json();
}

export async function getUser() {
  const url = `http://localhost:8000/api/user/`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
      }
      
      const json = await response.json();
      return json;
  } 

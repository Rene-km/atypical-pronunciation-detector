import { MessageCircle, Zap } from "lucide-react";
import { Hero115 } from "@/components/blocks/shadcnblocks-com-hero115";

const demoData = {
  icon: <MessageCircle className="size-8" />,
  heading: "Speak with confidence. Learn with precision.",
  description:
    "Enhance your pronunciation effortlessly with our Atypical Pronunciation Detector.",
  button: {
    text: "Make an account",
    icon: <Zap className="ml-2 size-4" />,
    url: "/register",
  },
  trustText: "Start improving today!",
  imageSrc: "/hero_pic (1).png",
  imageAlt: "placeholder",
};

export default function Home() {

 
  return (
  
    <div className="max-w-7xl mx-auto">
   <Hero115 {...demoData}/>
   </div>
    
  );
}

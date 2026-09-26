import { AdvisorPlatform } from '@/components/AdvisorPlatform';
import { ChatViewportEnhancer } from '@/components/ChatViewportEnhancer';

export default function HomePage() {
  return (
    <>
      <ChatViewportEnhancer />
      <AdvisorPlatform />
    </>
  );
}

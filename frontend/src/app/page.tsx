import { LotteryBox } from '@/components/lottery/LotteryBox';
import { DAOBox } from '@/components/dao/DAOBox';
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-6xl font-light tracking-tight text-black mb-16 text-center">
          Welcome to Nexus Network Hub
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <LotteryBox />
          <DAOBox />
        </div>
      </div>
    </main>
  );
}
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-blue-900 sm:text-5xl md:text-6xl">
          Social Media Analytics Dashboard
        </h1>
        <p className="mt-6 text-xl text-blue-700">
          Track, analyze, and optimize your social media performance across platforms
        </p>
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="inline-block rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:text-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
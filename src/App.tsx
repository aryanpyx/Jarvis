import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import JarvisInterface from "./components/JarvisInterface";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="sticky top-0 z-10 bg-black/20 backdrop-blur-sm h-16 flex justify-between items-center border-b border-blue-500/20 shadow-lg px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
            <span className="text-black font-bold text-sm">J</span>
          </div>
          <h2 className="text-xl font-semibold text-blue-400">JARVIS</h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto h-full">
          <Content />
        </div>
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="text-blue-400">Initializing JARVIS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Authenticated>
        <JarvisInterface />
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4">
              JARVIS
            </h1>
            <p className="text-xl text-blue-300 mb-2">
              Just A Rather Very Intelligent System
            </p>
            <p className="text-lg text-slate-400">
              Your advanced AI assistant awaits
            </p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}

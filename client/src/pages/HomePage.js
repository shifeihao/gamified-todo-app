import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  SparklesIcon,
  ChartBarIcon,
  BookOpenIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { LoginForm, RegisterForm } from "../components";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("login");

  const features = [
    {
      name: "Gamification of tasks",
      description: "Turn your to-do list into collectible cards",
      icon: SparklesIcon,
    },
    {
      name: "Maze exploration",
      description: "Navigate mazes to unlock new rewards",
      icon: ChartBarIcon,
    },
    {
      name: "Task Management",
      description: "Build your digital task library",
      icon: BookOpenIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navbar */}
      <nav className="fixed w-full bg-black/30 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <img src="/logo_min.png" alt="TaskMasters" className="h-8 w-auto" />
              <span className="text-2xl font-bold text-white">TaskMasters</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text content on the left */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-12"
            >
              <h1 className="text-5xl font-bold text-white leading-tight">
                Put Your To-Do List
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Become A Collectible Card
                </span>
              </h1>
              <p className="text-xl text-gray-300">
                Through the unique card collection system, task management
                becomes as interesting as a game. Complete goals, unlock
                achievements, and create your own exclusive task card book.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {features.map((feature) => (
                  <motion.div
                    key={feature.name}
                    whileHover={{ scale: 1.05 }}
                    className="p-6 bg-white/10 backdrop-blur-lg rounded-xl"
                  >
                    <feature.icon className="h-8 w-8 text-purple-400" />
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {feature.name}
                    </h3>
                    <p className="mt-2 text-gray-300">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Interactive display on the right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full" />
              <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl">
                <div className="border border-white/10 rounded-2xl p-6">
                  <div className="flex space-x-4 mb-6">
                    <button
                      onClick={() => setActiveTab("login")}
                      className={`px-6 py-3 rounded-xl ${
                        activeTab === "login"
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setActiveTab("register")}
                      className={`px-6 py-3 rounded-xl ${
                        activeTab === "register"
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  {activeTab === "login" ? (
                    <LoginForm isEmbedded={true} />
                  ) : (
                    <RegisterForm isEmbedded={true} />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

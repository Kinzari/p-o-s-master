"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

interface Cashier {
  id: number;
  username: string;
  fl_name: string;
  c_password: string;
}

export default function LoginForm() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false); // New state variable
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getCashiers = async () => {
      try {
        const response = await axios.get<Cashier[]>(
          "http://localhost/phpdata/cashiers.php"
        );
        console.log(response.data);
        setCashiers(response.data);
      } catch (error) {
        console.error("There was an error fetching the cashiers!", error);
        setError("Unable to fetch cashier data.");
      } finally {
        setFetchAttempted(true); // Set to true after fetch attempt
      }
    };

    getCashiers();
  }, [toast]);

  useEffect(() => {
    // Focus the username input on component mount
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    console.log("Username:", selectedUsername);
    console.log("Password:", password);
    try {
      const response = await axios.post(
        "http://localhost/phpdata/login.php",
        {
          username: selectedUsername,
          password,
        }
      );
      console.log(response.data);

      if (response.data.status === "success") {
        toast({ title: response.data.message, variant: "success" });
        localStorage.setItem("username", selectedUsername);
        localStorage.setItem("fullname", response.data.fullname);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("id", response.data.id);

        router.push(
          `/pos?username=${selectedUsername}&fullname=${response.data.fullname}`
        );
      } else {
        toast({
          title: "Login failed",
          variant: "destructive",
        });
        setError("Invalid username or password");
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Login failed",
        variant: "destructive",
      });
      setError("Invalid username or password");
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUsername("");
    setPassword("");
    setTimeout(() => {
      if (usernameRef.current) {
        usernameRef.current.focus();
      }
    }, 100); // Timeout to allow the UI to update
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      if (document.activeElement === usernameRef.current && passwordRef.current) {
        passwordRef.current.focus();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="w-full h-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] text-white">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 p-9">
          <div className="grid gap-2 text-left pb-4">
            <h1 className="text-3xl font-bold text-blue-400">LOGIN</h1>
            <p className="text-balance text-blue-400">
              Enter your credentials below to login to your account
            </p>
          </div>
          {fetchAttempted && error && <p className="text-red-500">{error}</p>}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="w-full p-2 text-black bg-white rounded-md"
                ref={usernameRef}
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                onKeyDown={handleKeyPress}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                className="w-full p-2 text-black bg-white rounded-md"
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                required
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white">
        <Image
          src="/LOGO.jpg"
          alt="Gaisano Logo"
          width={700}
          height={700}
          className="object-contain"
        />
      </div>
    </div>
  );
}

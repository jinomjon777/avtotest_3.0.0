import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TestStartPage } from "@/components/TestStartPage";
import { TestInterface } from "@/components/TestInterface";

const Index = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (testStarted && selectedVariant !== null) {
    return (
      <TestInterface 
        onExit={() => {
          setTestStarted(false);
          setSelectedVariant(null);
        }} 
        variant={selectedVariant}
      />
    );
  }

  return (
    <TestStartPage 
      onStartTest={(variant: number) => {
        setSelectedVariant(variant);
        setTestStarted(true);
      }} 
    />
  );
};

export default Index;

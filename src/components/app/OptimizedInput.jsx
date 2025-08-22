"use client";

import React, { useState, memo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OptimizedInput = memo(({ placeholder, onSubmit }) => {
  const [value, setValue] = useState("");
  
  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);
  
  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  }, [value, onSubmit]);
  
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="h-9 w-40"
      />
      <Button 
        onClick={handleSubmit} 
        disabled={!value.trim()}
      >
        Oluştur
      </Button>
    </div>
  );
});

OptimizedInput.displayName = "OptimizedInput";

export default OptimizedInput;

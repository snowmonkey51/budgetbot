import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalculatorIcon, X } from "lucide-react";

interface CalculatorProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Calculator({ isOpen, onToggle }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const formatDisplay = (value: string) => {
    if (value.length > 12) {
      return parseFloat(value).toExponential(6);
    }
    return value;
  };

  return (
    <>
      {/* Calculator Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Card className="h-full border-0 rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Calculator</CardTitle>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Display */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-right text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 min-h-[2rem] break-all">
                {formatDisplay(display)}
              </div>
            </div>

            {/* Calculator Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 */}
              <Button
                onClick={clear}
                variant="outline"
                className="col-span-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300"
              >
                Clear
              </Button>
              <Button
                onClick={() => setDisplay(display.slice(0, -1) || "0")}
                variant="outline"
                className="bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40"
              >
                ⌫
              </Button>
              <Button
                onClick={() => inputOperation("÷")}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                ÷
              </Button>

              {/* Row 2 */}
              <Button onClick={() => inputNumber("7")} variant="outline">7</Button>
              <Button onClick={() => inputNumber("8")} variant="outline">8</Button>
              <Button onClick={() => inputNumber("9")} variant="outline">9</Button>
              <Button
                onClick={() => inputOperation("×")}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                ×
              </Button>

              {/* Row 3 */}
              <Button onClick={() => inputNumber("4")} variant="outline">4</Button>
              <Button onClick={() => inputNumber("5")} variant="outline">5</Button>
              <Button onClick={() => inputNumber("6")} variant="outline">6</Button>
              <Button
                onClick={() => inputOperation("-")}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                -
              </Button>

              {/* Row 4 */}
              <Button onClick={() => inputNumber("1")} variant="outline">1</Button>
              <Button onClick={() => inputNumber("2")} variant="outline">2</Button>
              <Button onClick={() => inputNumber("3")} variant="outline">3</Button>
              <Button
                onClick={() => inputOperation("+")}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                +
              </Button>

              {/* Row 5 */}
              <Button
                onClick={() => inputNumber("0")}
                variant="outline"
                className="col-span-2"
              >
                0
              </Button>
              <Button onClick={inputDecimal} variant="outline">.</Button>
              <Button
                onClick={performCalculation}
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                =
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    const result = display;
                    navigator.clipboard.writeText(result);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Copy Result
                </Button>
                <Button
                  onClick={() => {
                    setDisplay("0");
                    setPreviousValue(null);
                    setOperation(null);
                    setWaitingForNewValue(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Reset All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-20"
          onClick={onToggle}
        />
      )}
    </>
  );
}
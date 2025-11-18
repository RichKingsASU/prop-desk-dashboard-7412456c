import { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

interface RiskCalculatorProps {
  symbol?: string;
  currentPrice?: number;
  atrValue?: number;
  loading?: boolean;
  selectedOption?: {
    strike: number;
    type: 'call' | 'put';
    last: number;
    delta: number;
    theta: number;
  } | null;
  onCalculate?: (results: { positionSize: number; positionValue: number; dollarRisk: number }) => void;
}

const calculatorSchema = z.object({
  accountEquity: z.number().positive({ message: "Account equity must be positive" }).max(100000000, { message: "Value too large" }),
  riskPercent: z.number().min(0.1, { message: "Min 0.1%" }).max(10, { message: "Max 10%" }),
  stopDistanceATR: z.number().min(0.1, { message: "Min 0.1 ATR" }).max(10, { message: "Max 10 ATR" }),
  entryPrice: z.number().positive({ message: "Entry price must be positive" }),
});

export function RiskCalculator({ 
  symbol = "SPY",
  currentPrice = 432.15,
  atrValue = 1.25,
  loading = false,
  selectedOption = null,
  onCalculate,
}: RiskCalculatorProps) {
  const [accountEquity, setAccountEquity] = useState<string>("10000");
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [stopDistanceATR, setStopDistanceATR] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<string>(currentPrice.toString());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine if we're calculating for options or stock
  const isOptionMode = selectedOption !== null;
  const optionPremium = selectedOption?.last || 0;

  // Calculate risk metrics
  const calculateRisk = () => {
    try {
      const equity = parseFloat(accountEquity) || 0;
      const entry = parseFloat(entryPrice) || currentPrice;
      
      // Validate inputs
      const validated = calculatorSchema.parse({
        accountEquity: equity,
        riskPercent,
        stopDistanceATR,
        entryPrice: entry,
      });

      // Calculate dollar risk
      const dollarRisk = validated.accountEquity * (validated.riskPercent / 100);
      
      let positionSize: number;
      let positionValue: number;
      let stopLossPrice: number;
      let positionPercent: number;
      let stopDistanceDollars: number;

      if (isOptionMode && selectedOption) {
        // OPTIONS CALCULATION
        // Each contract = 100 shares, so we divide by (premium × 100)
        const contractsNeeded = Math.floor(dollarRisk / (optionPremium * 100));
        positionSize = contractsNeeded;
        
        // Position value for options = contracts × premium × 100
        positionValue = contractsNeeded * optionPremium * 100;
        
        // For options, stop loss is typically based on % of premium or max loss = premium paid
        // Here we'll assume max loss is the full premium (total debit paid)
        stopDistanceDollars = optionPremium;
        stopLossPrice = 0; // Options can go to zero
        
        // Position as % of account
        positionPercent = (positionValue / validated.accountEquity) * 100;
      } else {
        // STOCK CALCULATION (original logic)
        stopDistanceDollars = validated.stopDistanceATR * atrValue;
        positionSize = Math.floor(dollarRisk / stopDistanceDollars);
        positionValue = positionSize * validated.entryPrice;
        stopLossPrice = validated.entryPrice - stopDistanceDollars;
        positionPercent = (positionValue / validated.accountEquity) * 100;
      }

      setErrors({});
      
      return {
        dollarRisk,
        stopDistanceDollars,
        positionSize,
        positionValue,
        stopLossPrice,
        positionPercent,
        valid: true,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return {
        dollarRisk: 0,
        stopDistanceDollars: 0,
        positionSize: 0,
        positionValue: 0,
        stopLossPrice: 0,
        positionPercent: 0,
        valid: false,
      };
    }
  };

  const results = useMemo(() => calculateRisk(), [
    accountEquity,
    riskPercent,
    stopDistanceATR,
    entryPrice,
    currentPrice,
    atrValue,
    isOptionMode,
    optionPremium,
    selectedOption?.strike,
    selectedOption?.type,
  ]);

  // Notify parent of calculation results
  useEffect(() => {
    if (results.valid && onCalculate) {
      onCalculate({
        positionSize: results.positionSize,
        positionValue: results.positionValue,
        dollarRisk: results.dollarRisk,
      });
    }
  }, [results, onCalculate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Risk Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 bg-muted/50 rounded animate-pulse" />
            <div className="h-10 bg-muted/50 rounded animate-pulse" />
            <div className="h-20 bg-muted/50 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Risk Calculator
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOptionMode && (
              <Badge variant="secondary" className="text-xs">
                Options Mode
              </Badge>
            )}
            <Badge variant="outline">{symbol}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Option Display */}
        {selectedOption && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">Selected Contract</span>
              <Badge variant="outline" className={selectedOption.type === 'call' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
                {selectedOption.type.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm font-mono">
              <span className="font-bold">${selectedOption.strike}</span> @ ${selectedOption.last.toFixed(2)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Delta: {selectedOption.delta.toFixed(3)}</div>
              <div>Theta: {selectedOption.theta.toFixed(3)}</div>
            </div>
          </div>
        )}

        {/* Account Equity Input */}
        <div className="space-y-2">
          <Label htmlFor="accountEquity" className="text-xs text-muted-foreground">
            Account Equity ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="accountEquity"
              type="number"
              value={accountEquity}
              onChange={(e) => setAccountEquity(e.target.value)}
              className="pl-9"
              placeholder="10000"
              max={100000000}
            />
          </div>
          {errors.accountEquity && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.accountEquity}
            </p>
          )}
        </div>

        {/* Risk Percentage Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="riskPercent" className="text-xs text-muted-foreground">
              Risk per Trade
            </Label>
            <span className="text-sm font-mono font-semibold text-foreground">
              {riskPercent.toFixed(1)}%
            </span>
          </div>
          <Slider
            id="riskPercent"
            value={[riskPercent]}
            onValueChange={(value) => setRiskPercent(value[0])}
            min={0.1}
            max={5}
            step={0.1}
            className="py-2"
          />
          {errors.riskPercent && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.riskPercent}
            </p>
          )}
        </div>

        {/* Stop Distance in ATR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="stopDistanceATR" className="text-xs text-muted-foreground">
              Stop Distance (ATR)
            </Label>
            <span className="text-sm font-mono font-semibold text-foreground">
              {stopDistanceATR.toFixed(1)} ATR
            </span>
          </div>
          <Slider
            id="stopDistanceATR"
            value={[stopDistanceATR]}
            onValueChange={(value) => setStopDistanceATR(value[0])}
            min={0.5}
            max={5}
            step={0.1}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            = ${(stopDistanceATR * atrValue).toFixed(2)} per share
          </p>
          {errors.stopDistanceATR && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.stopDistanceATR}
            </p>
          )}
        </div>

        {/* Entry Price Input */}
        <div className="space-y-2">
          <Label htmlFor="entryPrice" className="text-xs text-muted-foreground">
            Entry Price ($)
          </Label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="entryPrice"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="pl-9"
              placeholder={currentPrice.toString()}
              step="0.01"
            />
          </div>
          {errors.entryPrice && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.entryPrice}
            </p>
          )}
        </div>

        {/* Results Display */}
        {results.valid && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Dollar Risk:</span>
              <span className="font-mono font-semibold text-foreground">
                ${results.dollarRisk.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {isOptionMode ? 'Contracts:' : 'Position Size:'}
              </span>
              <span className="font-mono font-bold text-primary text-lg">
                {results.positionSize} {isOptionMode ? 'contracts' : 'shares'}
              </span>
            </div>
            
            {isOptionMode && selectedOption && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Controls (Delta Adj):</span>
                <span className="font-mono font-semibold text-foreground">
                  {Math.abs(results.positionSize * 100 * selectedOption.delta).toFixed(0)} shares
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Position Value:</span>
              <span className="font-mono font-semibold text-foreground">
                ${results.positionValue.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">% of Account:</span>
              <span className={`font-mono font-semibold ${
                results.positionPercent > 50 ? 'text-destructive' : 
                results.positionPercent > 30 ? 'text-yellow-500' : 
                'text-foreground'
              }`}>
                {results.positionPercent.toFixed(1)}%
              </span>
            </div>
            
            {!isOptionMode && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Stop Loss Price:</span>
                <span className="font-mono font-semibold text-destructive">
                  ${results.stopLossPrice.toFixed(2)}
                </span>
              </div>
            )}

            {isOptionMode && selectedOption && (
              <div className="p-2 bg-muted/30 rounded border border-border">
                <p className="text-xs text-muted-foreground">
                  Max Loss: ${(results.positionSize * optionPremium * 100).toFixed(2)} 
                  {selectedOption.theta < 0 && (
                    <span className="block mt-1">
                      Daily Theta decay: ${(Math.abs(selectedOption.theta) * results.positionSize * 100).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            )}

            {results.positionPercent > 50 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive">
                  Warning: Position exceeds 50% of account. Consider reducing risk or {isOptionMode ? 'premium exposure' : 'stop distance'}.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

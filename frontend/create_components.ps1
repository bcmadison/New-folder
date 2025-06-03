# Script to create all component files
Write-Host "📝 Creating component files..." -ForegroundColor Cyan

# Function to create a file with content
function Create-File {
    param (
        [string]$path,
        [string]$content
    )
    
    $directory = Split-Path -Path $path -Parent
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    
    Set-Content -Path $path -Value $content -Force
    Write-Host "📄 Created: $path" -ForegroundColor Green
}

# Create common components
$commonComponents = @{
    "src/components/common/LoadingSpinner.tsx" = @"
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-full items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}
"@

    "src/components/common/ErrorMessage.tsx" = @"
export function ErrorMessage({ error, className = '' }: { error: Error; className?: string }) {
  return (
    <div className={`rounded-lg bg-red-50 p-4 dark:bg-red-900/20 ${className}`}>
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Error</h3>
      <p className="mt-2 text-sm text-red-500 dark:text-red-300">{error.message}</p>
    </div>
  );
}
"@
}

# Create lineup components
$lineupComponents = @{
    "src/components/lineup/PlayerCard.tsx" = @"
import { Player } from '@/services/api';
import { ConfidenceIndicator } from '@/components/predictions/ConfidenceIndicator';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: (player: Player) => void;
  className?: string;
}

export function PlayerCard({ player, isSelected, onSelect, className = '' }: PlayerCardProps) {
  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 bg-white hover:border-primary-200 dark:border-gray-700 dark:bg-gray-800'
      } ${className}`}
      onClick={() => onSelect(player)}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{player.name}</h3>
        <span className="text-sm text-gray-500">{player.position}</span>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          \${player.salary.toLocaleString()}
        </span>
        <ConfidenceIndicator confidence={player.confidence} size="sm" />
      </div>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Projected: {player.projectedPoints.toFixed(1)} pts
      </div>
    </div>
  );
}
"@
}

# Create prediction components
$predictionComponents = @{
    "src/components/predictions/PredictionCard.tsx" = @"
import { Prediction } from '@/services/api';
import { SHAPChart } from './SHAPChart';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface PredictionCardProps {
  prediction: Prediction;
  className?: string;
}

export function PredictionCard({ prediction, className = '' }: PredictionCardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{prediction.playerId}</h3>
        <ConfidenceIndicator confidence={prediction.confidence} />
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">Projected Points</div>
        <div className="text-2xl font-bold text-primary-500">
          {prediction.projectedPoints.toFixed(1)}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-4 font-medium">Impact Factors</h4>
        <SHAPChart shapValues={prediction.shapValues} className="h-48" />
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date(prediction.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
"@
}

# Create each component file
$commonComponents.GetEnumerator() | ForEach-Object {
    Create-File -path $_.Key -content $_.Value
}

$lineupComponents.GetEnumerator() | ForEach-Object {
    Create-File -path $_.Key -content $_.Value
}

$predictionComponents.GetEnumerator() | ForEach-Object {
    Create-File -path $_.Key -content $_.Value
}

Write-Host "✅ All component files created successfully!" -ForegroundColor Green 
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlayerEntry {
    id: string;
    nameOnJersey: string;
    jerseyNumber: string;
    sizes: {
        top: string;
        shorts: string;
    };
}

export interface RosterData {
    teamName: string;
    players: PlayerEntry[];
}

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

interface RosterInputProps {
    value: RosterData;
    onChange: (data: RosterData) => void;
    className?: string;
}

export function RosterInput({ value = { teamName: "", players: [] }, onChange, className }: RosterInputProps) {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Defensive check for undefined value (handling potential store hydration issues)
    const safeValue = value || { teamName: "", players: [] };
    const players = safeValue.players || [];

    const addPlayer = useCallback(() => {
        const newPlayer: PlayerEntry = {
            id: crypto.randomUUID(),
            nameOnJersey: "",
            jerseyNumber: "",
            sizes: { top: "M", shorts: "M" },
        };
        onChange({
            ...safeValue,
            players: [...players, newPlayer],
        });
    }, [safeValue, players, onChange]);

    const removePlayer = useCallback((id: string) => {
        onChange({
            ...safeValue,
            players: players.filter((p) => p.id !== id),
        });
    }, [safeValue, players, onChange]);

    const updatePlayer = useCallback((id: string, updates: Partial<PlayerEntry>) => {
        onChange({
            ...safeValue,
            players: players.map((p) =>
                p.id === id ? { ...p, ...updates } : p
            ),
        });
    }, [safeValue, players, onChange]);

    const updatePlayerSize = useCallback((id: string, sizeType: "top" | "shorts", size: string) => {
        onChange({
            ...safeValue,
            players: players.map((p) =>
                p.id === id ? { ...p, sizes: { ...p.sizes, [sizeType]: size } } : p
            ),
        });
    }, [safeValue, players, onChange]);

    const totalJerseys = players.length;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold">Team Roster</h3>
                    {totalJerseys > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                            {totalJerseys} player{totalJerseys !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPlayer}
                    className="h-8 text-xs"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Player
                </Button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Important:</strong> Please double-check all names and numbers.
                    What you enter here is exactly what will be printed. Spelling errors
                    are the customer's responsibility.
                </p>
            </div>

            {/* Team Name */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Team Name</label>
                <Input
                    value={value.teamName}
                    onChange={(e) => onChange({ ...value, teamName: e.target.value })}
                    placeholder="e.g., Cobras"
                    className="h-9"
                />
            </div>

            {/* Player List */}
            {value.players.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No players added yet</p>
                    <p className="text-xs text-muted-foreground/70">Click "Add Player" to start building your roster</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Name on Jersey</div>
                        <div className="col-span-2">Number</div>
                        <div className="col-span-2">Top Size</div>
                        <div className="col-span-2">Shorts Size</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Player Rows */}
                    {value.players.map((player, index) => (
                        <div
                            key={player.id}
                            className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/30 rounded-lg border border-border/50"
                        >
                            {/* Row Number */}
                            <div className="col-span-1 text-xs font-medium text-muted-foreground text-center">
                                {index + 1}
                            </div>

                            {/* Name */}
                            <div className="col-span-4">
                                <Input
                                    value={player.nameOnJersey}
                                    onChange={(e) =>
                                        updatePlayer(player.id, { nameOnJersey: e.target.value.toUpperCase() })
                                    }
                                    placeholder="PLAYER NAME"
                                    className="h-8 text-xs uppercase font-medium"
                                />
                            </div>

                            {/* Number */}
                            <div className="col-span-2">
                                <Input
                                    value={player.jerseyNumber}
                                    onChange={(e) =>
                                        updatePlayer(player.id, { jerseyNumber: e.target.value.replace(/\D/g, '').slice(0, 2) })
                                    }
                                    placeholder="00"
                                    className="h-8 text-xs text-center font-bold"
                                    maxLength={2}
                                />
                            </div>

                            {/* Top Size */}
                            <div className="col-span-2">
                                <Select
                                    value={player.sizes.top}
                                    onValueChange={(size) => updatePlayerSize(player.id, "top", size)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SIZES.map((size) => (
                                            <SelectItem key={size} value={size} className="text-xs">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Shorts Size */}
                            <div className="col-span-2">
                                <Select
                                    value={player.sizes.shorts}
                                    onValueChange={(size) => updatePlayerSize(player.id, "shorts", size)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SIZES.map((size) => (
                                            <SelectItem key={size} value={size} className="text-xs">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Delete Button */}
                            <div className="col-span-1 flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePlayer(player.id)}
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {value.players.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-xs font-medium mb-2">Order Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {SIZES.map((size) => {
                            const topCount = value.players.filter((p) => p.sizes.top === size).length;
                            const shortsCount = value.players.filter((p) => p.sizes.shorts === size).length;
                            if (topCount === 0 && shortsCount === 0) return null;
                            return (
                                <div key={size} className="flex justify-between text-muted-foreground">
                                    <span>{size}:</span>
                                    <span>
                                        {topCount > 0 && `${topCount} top${topCount !== 1 ? "s" : ""}`}
                                        {topCount > 0 && shortsCount > 0 && ", "}
                                        {shortsCount > 0 && `${shortsCount} shorts`}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="col-span-2 pt-2 mt-2 border-t flex justify-between font-semibold">
                            <span>Total Jerseys:</span>
                            <span>{value.players.length}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

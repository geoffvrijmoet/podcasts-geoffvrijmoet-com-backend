"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Episode = {
  client: string;
  episodeTitle: string;
  type: string;
  earnedAfterFees: number;
  invoicedAmount: number;
  billedMinutes: number;
  lengthHours: number;
  lengthMinutes: number;
  lengthSeconds: number;
  paymentMethod: string;
  editingHours: number;
  editingMinutes: number;
  editingSeconds: number;
  billableHours: number;
  runningHourlyTotal: number;
  ratePerMinute: number;
  dateInvoiced: string;
  datePaid: string;
  note: string;
};

type EpisodeLength = {
  hours: number;
  minutes: number;
  seconds: number;
};

type TimeEntry = {
  hours: number;
  minutes: number;
  seconds: number;
};

type TimeLogFormData = {
  episodeId: string;
  lengths: EpisodeLength[];
  timeEntries: TimeEntry[];
  rate: number;
  rateType: 'per-episode' | 'per-minute' | 'per-hour';
  episodeType: 'Podcast' | 'Video';
  date: string;
  note: string;
  paymentMethod: 'Venmo' | 'PayPal' | '';
  isInvoiced: boolean;
};

type NewEpisodeData = {
  podcastName: string;
  episodeTitle: string;
  episodeType: string;
  isInvoiced: boolean;
  date: string;
};

export function EpisodeForm() {
  const [loading, setLoading] = useState(false);
  const [fetchingEpisodes, setFetchingEpisodes] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showNewEpisodeDialog, setShowNewEpisodeDialog] = useState(false);
  const [newEpisode, setNewEpisode] = useState<NewEpisodeData>({
    podcastName: "",
    episodeTitle: "",
    episodeType: "Podcast",
    isInvoiced: false,
    date: new Date().toISOString().split('T')[0],
  });
  const [formData, setFormData] = useState<TimeLogFormData>({
    episodeId: "",
    lengths: [{
      hours: 0,
      minutes: 0,
      seconds: 0
    }],
    timeEntries: [{
      hours: 0,
      minutes: 0,
      seconds: 0
    }],
    rate: 0,
    rateType: 'per-episode',
    episodeType: 'Podcast',
    date: new Date().toISOString().split('T')[0],
    note: "",
    paymentMethod: 'Venmo',
    isInvoiced: false,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch existing episodes when component mounts
  useEffect(() => {
    fetchEpisodes();
  }, []);

  async function fetchEpisodes() {
    try {
      setFetchingEpisodes(true);
      const response = await fetch("/api/sheets");
      const { data } = await response.json();
      setEpisodes(data || []);
    } catch (error) {
      console.error("Error fetching episodes:", error);
    } finally {
      setFetchingEpisodes(false);
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const handleNewEpisodeSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episode: {
            ...newEpisode,
            client: newEpisode.podcastName,
            type: newEpisode.episodeType,
            earnedAfterFees: 0,
            invoicedAmount: 0,
            billedMinutes: 0,
            lengthHours: 0,
            lengthMinutes: 0,
            lengthSeconds: 0,
            paymentMethod: "",
            editingHours: 0,
            editingMinutes: 0,
            editingSeconds: 0,
            billableHours: 0,
            runningHourlyTotal: 0,
            dateInvoiced: newEpisode.isInvoiced ? formatDate(newEpisode.date) : '',
            datePaid: "",
            note: "",
            ratePerMinute: 0
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create episode");

      // Refresh episodes list
      await fetchEpisodes();
      setShowNewEpisodeDialog(false);
      setNewEpisode({ 
        podcastName: "", 
        episodeTitle: "", 
        episodeType: "Podcast",
        isInvoiced: false,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error creating episode:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeSelect = (value: string) => {
    if (value === "new") {
      setShowNewEpisodeDialog(true);
    } else {
      const reversedIndex = episodes.length - 1 - parseInt(value);
      const selectedEpisode = episodes[reversedIndex];
      console.log('Selected episode:', selectedEpisode);
      
      if (selectedEpisode) {
        const newFormData = {
          ...formData,
          episodeId: value,
          lengths: [{
            hours: selectedEpisode.lengthHours || 0,
            minutes: selectedEpisode.lengthMinutes || 0,
            seconds: selectedEpisode.lengthSeconds || 0
          }],
          timeEntries: [{
            hours: selectedEpisode.editingHours || 0,
            minutes: selectedEpisode.editingMinutes || 0,
            seconds: selectedEpisode.editingSeconds || 0
          }],
        };
        
        console.log('Setting form data to:', newFormData);
        setFormData(newFormData);
        updateDefaultRates(selectedEpisode.client);
      }
    }
  };

  const sumTimeEntries = (entries: TimeEntry[]) => {
    const total = entries.reduce(
      (acc, entry) => {
        let totalSeconds = acc.seconds + entry.seconds;
        let totalMinutes = acc.minutes + entry.minutes + Math.floor(totalSeconds / 60);
        const totalHours = acc.hours + entry.hours + Math.floor(totalMinutes / 60);
        
        totalSeconds = totalSeconds % 60;
        totalMinutes = totalMinutes % 60;

        return {
          hours: totalHours,
          minutes: totalMinutes,
          seconds: totalSeconds
        };
      },
      { hours: 0, minutes: 0, seconds: 0 }
    );

    return total;
  };

  const calculateInvoiceAmount = (
    rateType: 'per-episode' | 'per-minute' | 'per-hour',
    rate: number,
    totalLength: { hours: number; minutes: number; seconds: number },
    totalTimeSpent: { hours: number; minutes: number; seconds: number }
  ): number => {
    if (rateType === 'per-episode') {
      return rate;
    } else if (rateType === 'per-minute') {
      const totalMinutes = totalLength.hours * 60 + totalLength.minutes + (totalLength.seconds / 60);
      return rate * totalMinutes;
    } else { // per-hour
      const totalHours = totalTimeSpent.hours + (totalTimeSpent.minutes / 60) + (totalTimeSpent.seconds / 3600);
      return rate * totalHours;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reversedIndex = episodes.length - 1 - parseInt(formData.episodeId);
      
      // Sum up all length entries and time entries
      const totalLength = sumTimeEntries(formData.lengths);
      const totalTimeSpent = sumTimeEntries(formData.timeEntries);
      
      // Calculate billed minutes (total length in minutes)
      const billedMinutes = (totalLength.hours * 60) + totalLength.minutes + (totalLength.seconds / 60);
      
      // Calculate invoice amount
      const invoicedAmount = calculateInvoiceAmount(
        formData.rateType,
        formData.rate,
        totalLength,
        totalTimeSpent
      );

      // Calculate amount after payment processing fee
      const processingFee = formData.paymentMethod ? calculatePaymentFee(invoicedAmount, formData.paymentMethod) : 0;
      const earnedAfterFees = invoicedAmount - processingFee;

      // Calculate hourly rate
      const totalHours = totalTimeSpent.hours + (totalTimeSpent.minutes / 60) + (totalTimeSpent.seconds / 3600);
      const runningHourlyTotal = earnedAfterFees / totalHours;

      // Calculate rate per minute for the spreadsheet
      const ratePerMinute = formData.rateType === 'per-minute' ? formData.rate : 
        (invoicedAmount / (totalLength.hours * 60 + totalLength.minutes + (totalLength.seconds / 60)));

      const updatedEpisode = {
        ...episodes[reversedIndex],
        client: episodes[reversedIndex].client,
        type: formData.episodeType,
        lengthHours: totalLength.hours,
        lengthMinutes: totalLength.minutes,
        lengthSeconds: totalLength.seconds,
        editingHours: totalTimeSpent.hours,
        editingMinutes: totalTimeSpent.minutes,
        editingSeconds: totalTimeSpent.seconds,
        billedMinutes: Math.round(billedMinutes * 100) / 100,
        invoicedAmount,
        earnedAfterFees,
        runningHourlyTotal,
        ratePerMinute,
        dateInvoiced: formData.isInvoiced ? formatDate(formData.date) : '',
        note: formData.note,
        paymentMethod: formData.paymentMethod
      };

      const response = await fetch("/api/sheets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: reversedIndex,
          episode: updatedEpisode
        })
      });

      if (!response.ok) throw new Error("Failed to log time");

      // Reset form
      setFormData({
        episodeId: "",
        lengths: [{
          hours: 0,
          minutes: 0,
          seconds: 0
        }],
        timeEntries: [{
          hours: 0,
          minutes: 0,
          seconds: 0
        }],
        rate: 0,
        rateType: 'per-episode',
        episodeType: 'Podcast',
        date: new Date().toISOString().split('T')[0],
        note: "",
        paymentMethod: 'Venmo',
        isInvoiced: false,
      });

      // Refresh episodes list
      await fetchEpisodes();

    } catch (error) {
      console.error("Error logging time:", error);
    } finally {
      setLoading(false);
    }
  };

  const addLengthEntry = () => {
    setFormData({
      ...formData,
      lengths: [...formData.lengths, { hours: 0, minutes: 0, seconds: 0 }]
    });
  };

  const removeLengthEntry = (index: number) => {
    setFormData({
      ...formData,
      lengths: formData.lengths.filter((_, i) => i !== index)
    });
  };

  const updateLength = (index: number, field: keyof EpisodeLength, value: number) => {
    const newLengths = [...formData.lengths];
    newLengths[index] = { ...newLengths[index], [field]: value };
    setFormData({ ...formData, lengths: newLengths });
  };

  const addTimeEntry = () => {
    setFormData({
      ...formData,
      timeEntries: [...formData.timeEntries, { hours: 0, minutes: 0, seconds: 0 }]
    });
  };

  const updateTimeEntry = (index: number, field: keyof TimeEntry, value: number) => {
    const newTimeEntries = [...formData.timeEntries];
    newTimeEntries[index] = { ...newTimeEntries[index], [field]: value };
    setFormData({ ...formData, timeEntries: newTimeEntries });
  };

  const updateDefaultRates = (clientName: string, episodeType: 'Podcast' | 'Video' = 'Podcast') => {
    if (clientName === 'MMIH') {
      setFormData(prev => ({
        ...prev,
        rate: 75,
        rateType: 'per-episode',
        episodeType: 'Podcast'
      }));
    } else if (clientName === "That's My Girl") {
      if (episodeType === 'Podcast') {
        setFormData(prev => ({
          ...prev,
          rate: 1.25,
          rateType: 'per-minute',
          episodeType: 'Podcast'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          rate: 47,
          rateType: 'per-hour',
          episodeType: 'Video'
        }));
      }
    }
  };

  const handleDeleteEpisode = async () => {
    if (!formData.episodeId || !window.confirm('Are you sure you want to delete this episode?')) {
      return;
    }

    try {
      setLoading(true);
      const reversedIndex = episodes.length - 1 - parseInt(formData.episodeId);
      
      const response = await fetch('/api/sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: reversedIndex + 2 // +2 to account for header row and 0-based index
        })
      });

      if (!response.ok) throw new Error('Failed to delete episode');

      // Reset form and refresh episodes
      setFormData({
        episodeId: "",
        lengths: [{ hours: 0, minutes: 0, seconds: 0 }],
        timeEntries: [{ hours: 0, minutes: 0, seconds: 0 }],
        rate: 0,
        rateType: 'per-episode',
        episodeType: 'Podcast',
        date: new Date().toISOString().split('T')[0],
        note: "",
        paymentMethod: 'Venmo',
        isInvoiced: false,
      });
      await fetchEpisodes();

    } catch (error) {
      console.error('Error deleting episode:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentFee = (amount: number, method: 'Venmo' | 'PayPal'): number => {
    const fees = {
      Venmo: { percentage: 0.019, flat: 0.10 },
      PayPal: { percentage: 0.029, flat: 0.10 }
    };

    const { percentage, flat } = fees[method];
    return amount * percentage + flat;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label>Select Episode</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={formData.episodeId}
                  onValueChange={handleEpisodeSelect}
                  onOpenChange={setDropdownOpen}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select episode to log time for" />
                  </SelectTrigger>
                  <SelectContent>
                    {fetchingEpisodes && dropdownOpen ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <SelectItem value="new">➕ Create New Episode</SelectItem>
                        {episodes
                          .filter(episode => episode.client && episode.episodeTitle)
                          .reverse()
                          .map((episode, index) => (
                            <SelectItem 
                              key={index} 
                              value={index.toString()}
                            >
                              {`${episode.client} - ${episode.episodeTitle}`}
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {formData.episodeId && formData.episodeId !== 'new' && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteEpisode}
                  disabled={loading}
                >
                  🗑️
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Episode Length</Label>
              
              {formData.lengths.map((length, index) => (
                <div key={index} className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        value={length.hours}
                        onChange={(e) => updateLength(index, 'hours', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={length.minutes}
                        onChange={(e) => updateLength(index, 'minutes', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Seconds</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={length.seconds}
                        onChange={(e) => updateLength(index, 'seconds', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLengthEntry(index)}
                      className="text-red-500"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLengthEntry}
                className="mt-2"
              >
                Add Length +
              </Button>
            </div>

            <div className="space-y-4">
              <Label>Time Spent Editing</Label>
              
              {formData.timeEntries.map((entry, index) => (
                <div key={index} className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        value={entry.hours}
                        onChange={(e) => updateTimeEntry(index, 'hours', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={entry.minutes}
                        onChange={(e) => updateTimeEntry(index, 'minutes', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Seconds</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={entry.seconds}
                        onChange={(e) => updateTimeEntry(index, 'seconds', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeEntry}
                className="mt-2"
              >
                Add Time +
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Rate</Label>
            <div className="flex items-end gap-4">
              <div className="w-32">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                    className="pl-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="per-episode"
                    name="rate-type"
                    value="per-episode"
                    checked={formData.rateType === 'per-episode'}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'per-episode' | 'per-minute' | 'per-hour' })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="per-episode" className="text-sm font-normal">
                    per episode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="per-minute"
                    name="rate-type"
                    value="per-minute"
                    checked={formData.rateType === 'per-minute'}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'per-episode' | 'per-minute' | 'per-hour' })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="per-minute" className="text-sm font-normal">
                    per minute
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="per-hour"
                    name="rate-type"
                    value="per-hour"
                    checked={formData.rateType === 'per-hour'}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'per-episode' | 'per-minute' | 'per-hour' })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="per-hour" className="text-sm font-normal">
                    per hour
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Episode Type</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="podcast"
                  name="episode-type"
                  value="Podcast"
                  checked={formData.episodeType === 'Podcast'}
                  onChange={(e) => {
                    const newType = e.target.value as 'Podcast' | 'Video';
                    const currentEpisode = episodes[parseInt(formData.episodeId)];
                    if (currentEpisode?.client) {
                      updateDefaultRates(currentEpisode.client, newType);
                    } else {
                      setFormData(prev => ({ ...prev, episodeType: newType }));
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="podcast" className="text-sm font-normal">
                  Podcast
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="video"
                  name="episode-type"
                  value="Video"
                  checked={formData.episodeType === 'Video'}
                  onChange={(e) => {
                    const newType = e.target.value as 'Podcast' | 'Video';
                    const currentEpisode = episodes[parseInt(formData.episodeId)];
                    if (currentEpisode?.client) {
                      updateDefaultRates(currentEpisode.client, newType);
                    } else {
                      setFormData(prev => ({ ...prev, episodeType: newType }));
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="video" className="text-sm font-normal">
                  Video
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isInvoiced"
                checked={formData.isInvoiced}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isInvoiced: e.target.checked 
                }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isInvoiced" className="text-sm font-normal">
                This episode has been invoiced
              </Label>
            </div>

            {formData.isInvoiced && (
              <div className="space-y-2">
                <Label>Date Invoiced</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-[200px]"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes</Label>
            <Input
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Any additional notes about this editing session"
            />
          </div>

          <div className="space-y-4">
            <Label>Payment Method</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="venmo"
                  name="payment-method"
                  value="Venmo"
                  checked={formData.paymentMethod === 'Venmo'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentMethod: e.target.value as 'Venmo' | 'PayPal' 
                  }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="venmo" className="text-sm font-normal">
                  Venmo (1.9% + $0.10)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="paypal"
                  name="payment-method"
                  value="PayPal"
                  checked={formData.paymentMethod === 'PayPal'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentMethod: e.target.value as 'Venmo' | 'PayPal' 
                  }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="paypal" className="text-sm font-normal">
                  PayPal (2.9% + $0.10)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Logging Time..." : "Log Time"}
        </Button>
      </form>

      <Dialog open={showNewEpisodeDialog} onOpenChange={setShowNewEpisodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Episode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Podcast Name</Label>
              <Select
                value={newEpisode.podcastName}
                onValueChange={(value) => {
                  setNewEpisode({ ...newEpisode, podcastName: value });
                  updateDefaultRates(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select podcast" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="That's My Girl">That&apos;s My Girl</SelectItem>
                  <SelectItem value="MMIH">MMIH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Episode Title</Label>
              <Input
                value={newEpisode.episodeTitle}
                onChange={(e) => setNewEpisode({ ...newEpisode, episodeTitle: e.target.value })}
                placeholder="e.g., 506 - Gil Gayle"
              />
            </div>

            <div className="space-y-2">
              <Label>Episode Type</Label>
              <Select
                value={newEpisode.episodeType}
                onValueChange={(value) => setNewEpisode({ ...newEpisode, episodeType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Podcast">Podcast</SelectItem>
                  <SelectItem value="Podcast Video">Podcast Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="newEpisodeInvoiced"
                checked={newEpisode.isInvoiced}
                onChange={(e) => setNewEpisode(prev => ({ 
                  ...prev, 
                  isInvoiced: e.target.checked 
                }))}
                className="h-4 w-4"
              />
              <Label htmlFor="newEpisodeInvoiced" className="text-sm font-normal">
                This episode has been invoiced
              </Label>
            </div>

            {newEpisode.isInvoiced && (
              <div className="space-y-2">
                <Label>Date Invoiced</Label>
                <Input
                  type="date"
                  value={newEpisode.date}
                  onChange={(e) => setNewEpisode(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full"
                />
              </div>
            )}

            <Button 
              onClick={handleNewEpisodeSubmit} 
              disabled={loading || !newEpisode.podcastName || !newEpisode.episodeTitle}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Episode"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
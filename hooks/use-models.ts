import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModelsService, type Model } from '@/lib/models-service';

export const useModels = () => {
  const queryClient = useQueryClient();

  // Get all models with caching and automatic background refresh
  const { 
    data: models = [], 
    isLoading, 
    error 
  } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: ModelsService.getAllModels,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get active models with caching
  const { 
    data: activeModels = [], 
    isLoading: isLoadingActive 
  } = useQuery<Model[]>({
    queryKey: ['models', 'active'],
    queryFn: ModelsService.getActiveModels,
    select: (data) => data || [],
    enabled: !!models.length, // Only run if we have models
  });

  // Toggle model status with optimistic updates
  const toggleModelStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await ModelsService.toggleModelStatus(id, isActive);
      return { id, isActive };
    },
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['models'] });
      
      // Snapshot the previous value
      const previousModels = queryClient.getQueryData<Model[]>(['models']);

      // Optimistically update the cache
      if (previousModels) {
        queryClient.setQueryData<Model[]>(['models'], (old) =>
          old?.map((model) =>
            model.id === id ? { ...model, is_active: isActive } : model
          )
        );
      }

      // Return a context with the previous value
      return { previousModels };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousModels) {
        queryClient.setQueryData(['models'], context.previousModels);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });

  // Get model stats with caching
  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['models', 'stats'],
    queryFn: ModelsService.getModelStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    models,
    activeModels,
    stats,
    isLoading,
    isLoadingActive,
    isLoadingStats,
    error,
    toggleModelStatus: toggleModelStatus.mutate,
  };
};

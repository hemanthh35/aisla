# AISLA Performance Optimization Guide

## AI Generation Speed

### Experiment Generation
- **Current Speed**: 30-60 seconds
- **Optimization**: Reduced tokens (4000→1200), simplified prompts, threading (8 threads)
- **Parameters**:
  - `temperature: 0.5` (faster convergence)
  - `num_ctx: 2048` (smaller context window)
  - `num_thread: 8` (parallel processing)
  - `top_k: 20` (focused sampling)

### Quiz Generation
- **Current Speed**: 20-40 seconds
- **Optimization**: Reduced tokens (2500→800), concise prompts
- **Parameters**:
  - `maxTokens: 800` (70% reduction)
  - Input: 1000 chars (60% reduction)

### Chat Streaming
- **Real-time Streaming**: Token-by-token SSE (Server-Sent Events)
- **Model**: gemma3:4b (4B parameters, fast inference)
- **Context Window**: 4096 tokens

## Database Performance

### Indexes
- User authentication: `email` index
- Experiments: `createdBy` index for faculty queries
- Quizzes: `experimentId` index for fast lookups
- Submissions: `userId` + `experimentId` composite index

### Query Optimization
- Lean queries for list operations (exclude unused fields)
- Pagination for large datasets
- Select specific fields instead of full documents

## Frontend Performance

### React Optimization
- Lazy loading for experiment cards
- SSE streaming for real-time chat
- Smooth animations (60fps)
- CSS variables for fast theme switching

### Asset Optimization
- SVG icons (no image requests)
- CSS-in-JS for dynamic styling
- Minimal bundle size (React + Router only)

## Deployment Performance

### Server Configuration
- Node.js 20.x (latest LTS)
- ES modules (faster startup)
- Production mode enabled
- Static asset serving (gzip)

### Render Configuration
- Free tier: ~10-15 second cold start
- Starter tier: ~5 second warm start
- Auto-scaling available
- Geographic distribution

## Monitoring

### Performance Metrics
- AI generation time (logged at start/end)
- API response times
- Database query time
- Error rates

### Logging
```javascript
console.log(`✅ [AI] Generation took ${elapsed}s`);
console.log(`📖 [API] Response time: ${Date.now() - start}ms`);
```

## Best Practices

1. **Use Ollama locally** for fastest inference
2. **Stream responses** for better UX
3. **Cache frequently accessed data**
4. **Batch operations** when possible
5. **Monitor logs** for bottlenecks

## Benchmarks

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Experiment Generation | 5 minutes | 30-60s | 5-10x faster |
| Quiz Generation | 2-3 minutes | 20-40s | 3-9x faster |
| Chat Response | Variable | <1s per token | Streaming |
| API Response | 200-500ms | 50-150ms | 2-3x faster |

## Troubleshooting

### Slow AI Generation
- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Monitor CPU usage
- Reduce `num_ctx` if memory constrained
- Use smaller model if needed

### High API Latency
- Check database connection
- Monitor MongoDB Atlas metrics
- Check network conditions
- Consider read replicas

### Front-end Lag
- Check browser console for errors
- Inspect network tab for slow requests
- Profile React components
- Check browser memory usage

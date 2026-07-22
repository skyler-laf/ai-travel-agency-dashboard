import json
import asyncio
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from backend.agents import TravelCoordinatorAgent

router = APIRouter()
coordinator = TravelCoordinatorAgent()

@router.get("/api/plan-trip")
async def plan_trip_endpoint(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    dates: str = Query(..., description="Dates, e.g. July 10-17"),
    budget: float = Query(..., description="Total budget in USD"),
    preferences: str = Query("", description="Traveler preferences")
):
    queue = asyncio.Queue()

    # Progress callback mapping to JSON SSE yield
    async def progress_callback(agent_name: str, message: str):
        await queue.put({
            "type": "progress",
            "agent": agent_name,
            "message": message
        })

    # Background executor task
    async def run_planner():
        try:
            result = await coordinator.plan_trip(
                origin=origin,
                destination=destination,
                dates=dates,
                budget=budget,
                preferences=preferences,
                callback=progress_callback
            )
            # Final result payload
            await queue.put({
                "type": "result",
                "data": result.model_dump()
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            await queue.put({
                "type": "error",
                "message": f"Orchestrator failed: {str(e)}"
            })
        finally:
            await queue.put(None) # end of stream

    # Launch background task
    asyncio.create_task(run_planner())

    # SSE Event Generator
    async def event_generator():
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

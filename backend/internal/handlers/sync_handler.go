package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/realtime"
)

type SyncHandler struct {
	mediaCollection *mongo.Collection
	syncCollection  *mongo.Collection
	hub             *realtime.Hub
}

type StartSyncRequest struct {
	MediaID         string `json:"mediaId" binding:"required"`
	DurationSeconds int    `json:"durationSeconds" binding:"required,min=1,max=3600"`
}

type syncDocument struct {
	ID              bson.ObjectID `bson:"_id,omitempty"`
	MediaID         bson.ObjectID `bson:"media_id"`
	DurationSeconds int           `bson:"duration_seconds"`
	StartsAt        time.Time     `bson:"starts_at"`
	EndsAt          time.Time     `bson:"ends_at"`
	CreatedAt       time.Time     `bson:"created_at"`
}

type syncMediaPayload struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	URL      string `json:"url,omitempty"`
	Duration int    `json:"duration"`
}

type syncPayload struct {
	ID              string           `json:"id"`
	Media           syncMediaPayload `json:"media"`
	DurationSeconds int              `json:"durationSeconds"`
	StartsAt        time.Time        `json:"startsAt"`
	EndsAt          time.Time        `json:"endsAt"`
}

func NewSyncHandler(
	database *mongo.Database,
	hub *realtime.Hub,
) *SyncHandler {
	return &SyncHandler{
		mediaCollection: database.Collection("media"),
		syncCollection:  database.Collection("sync_events"),
		hub:             hub,
	}
}

func (handler *SyncHandler) StartSync(c *gin.Context) {
	var request StartSyncRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	mediaID, err := bson.ObjectIDFromHex(request.MediaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid media ID",
		})
		return
	}

	requestContext, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	var mediaDocument bson.M

	err = handler.mediaCollection.FindOne(
		requestContext,
		bson.M{"_id": mediaID},
	).Decode(&mediaDocument)

	if errors.Is(err, mongo.ErrNoDocuments) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "media item not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to retrieve media",
		})
		return
	}

	now := time.Now().UTC()

	// A short delay gives every connected browser time to receive the event.
	startsAt := now.Add(1500 * time.Millisecond)
	endsAt := startsAt.Add(
		time.Duration(request.DurationSeconds) * time.Second,
	)

	document := syncDocument{
		ID:              bson.NewObjectID(),
		MediaID:         mediaID,
		DurationSeconds: request.DurationSeconds,
		StartsAt:        startsAt,
		EndsAt:          endsAt,
		CreatedAt:       now,
	}

	if _, err := handler.syncCollection.InsertOne(
		requestContext,
		document,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to save sync event",
		})
		return
	}

	payload := buildSyncPayload(document, mediaDocument)

	handler.hub.Broadcast(realtime.Message{
		Type: "sync.started",
		Data: payload,
	})

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    payload,
	})
}

func (handler *SyncHandler) GetActiveSync(c *gin.Context) {
	requestContext, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	var document syncDocument

	err := handler.syncCollection.FindOne(
		requestContext,
		bson.M{
			"ends_at": bson.M{
				"$gt": time.Now().UTC(),
			},
		},
		options.FindOne().SetSort(
			bson.D{{Key: "created_at", Value: -1}},
		),
	).Decode(&document)

	if errors.Is(err, mongo.ErrNoDocuments) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    nil,
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to retrieve active sync",
		})
		return
	}

	var mediaDocument bson.M

	err = handler.mediaCollection.FindOne(
		requestContext,
		bson.M{"_id": document.MediaID},
	).Decode(&mediaDocument)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to retrieve synchronized media",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    buildSyncPayload(document, mediaDocument),
	})
}

func buildSyncPayload(
	document syncDocument,
	mediaDocument bson.M,
) syncPayload {
	return syncPayload{
		ID: document.ID.Hex(),
		Media: syncMediaPayload{
			ID:       document.MediaID.Hex(),
			Name:     stringValue(mediaDocument["name"]),
			Type:     stringValue(mediaDocument["type"]),
			URL:      stringValue(mediaDocument["url"]),
			Duration: integerValue(mediaDocument["default_duration"]),
		},
		DurationSeconds: document.DurationSeconds,
		StartsAt:        document.StartsAt,
		EndsAt:          document.EndsAt,
	}
}

func stringValue(value any) string {
	result, _ := value.(string)
	return result
}

func integerValue(value any) int {
	switch number := value.(type) {
	case int:
		return number
	case int32:
		return int(number)
	case int64:
		return int(number)
	case float64:
		return int(number)
	default:
		return 0
	}
}

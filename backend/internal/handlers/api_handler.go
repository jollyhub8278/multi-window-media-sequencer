package handlers

import (
	"context"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/models"
	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/repository"
)

type APIHandler struct {
	repository *repository.Repository
}

type MediaResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	URL      string `json:"url,omitempty"`
	Duration int    `json:"duration"`
}

type DisplayWindowResponse struct {
	ID                   string          `json:"id"`
	Name                 string          `json:"name"`
	Playlist             []MediaResponse `json:"playlist"`
	CycleDurationSeconds int             `json:"cycleDurationSeconds"`
}

func NewAPIHandler(
	repository *repository.Repository,
) *APIHandler {
	return &APIHandler{
		repository: repository,
	}
}

func (handler *APIHandler) GetMedia(
	ginContext *gin.Context,
) {
	requestContext, cancel := context.WithTimeout(
		ginContext.Request.Context(),
		10*time.Second,
	)
	defer cancel()

	mediaItems, err := handler.repository.GetAllMedia(
		requestContext,
	)
	if err != nil {
		ginContext.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to load media",
		})
		return
	}

	response := make([]MediaResponse, 0, len(mediaItems))

	for _, media := range mediaItems {
		response = append(response, MediaResponse{
			ID:       media.ID.Hex(),
			Name:     media.Name,
			Type:     media.Type,
			URL:      media.URL,
			Duration: media.DefaultDuration,
		})
	}

	ginContext.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

func (handler *APIHandler) GetWindows(
	ginContext *gin.Context,
) {
	requestContext, cancel := context.WithTimeout(
		ginContext.Request.Context(),
		10*time.Second,
	)
	defer cancel()

	displayWindows, err := handler.repository.GetAllWindows(
		requestContext,
	)
	if err != nil {
		ginContext.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to load display windows",
		})
		return
	}

	mediaItems, err := handler.repository.GetAllMedia(
		requestContext,
	)
	if err != nil {
		ginContext.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to load playlist media",
		})
		return
	}

	mediaByID := make(map[string]models.Media)

	for _, media := range mediaItems {
		mediaByID[media.ID.Hex()] = media
	}

	response := make(
		[]DisplayWindowResponse,
		0,
		len(displayWindows),
	)

	for _, displayWindow := range displayWindows {
		sort.Slice(
			displayWindow.Playlist,
			func(firstIndex, secondIndex int) bool {
				return displayWindow.Playlist[firstIndex].Position <
					displayWindow.Playlist[secondIndex].Position
			},
		)

		playlist := make(
			[]MediaResponse,
			0,
			len(displayWindow.Playlist),
		)

		for _, playlistItem := range displayWindow.Playlist {
			media, exists := mediaByID[playlistItem.MediaID.Hex()]
			if !exists {
				continue
			}

			duration := playlistItem.DisplayDuration
			if duration <= 0 {
				duration = media.DefaultDuration
			}

			playlist = append(playlist, MediaResponse{
				ID:       media.ID.Hex(),
				Name:     media.Name,
				Type:     media.Type,
				URL:      media.URL,
				Duration: duration,
			})
		}

		response = append(response, DisplayWindowResponse{
			ID:                   displayWindow.ID.Hex(),
			Name:                 displayWindow.Name,
			Playlist:             playlist,
			CycleDurationSeconds: displayWindow.CycleDurationSeconds,
		})
	}

	ginContext.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

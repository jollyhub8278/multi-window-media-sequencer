package seed

import (
	"context"
	"log"
	"time"

	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

const fiveHoursInSeconds = 5 * 60 * 60

func Database(
	parentContext context.Context,
	database *mongo.Database,
) error {
	contextWithTimeout, cancel := context.WithTimeout(
		parentContext,
		20*time.Second,
	)
	defer cancel()

	mediaCollection := database.Collection("media")
	windowCollection := database.Collection("windows")

	mediaCount, err := mediaCollection.CountDocuments(
		contextWithTimeout,
		bson.M{},
	)
	if err != nil {
		return err
	}

	windowCount, err := windowCollection.CountDocuments(
		contextWithTimeout,
		bson.M{},
	)
	if err != nil {
		return err
	}

	if mediaCount > 0 || windowCount > 0 {
		log.Println("Seed data already exists. Skipping database seed.")
		return nil
	}

	currentTime := time.Now().UTC()

	mountainImage := models.Media{
		ID:              bson.NewObjectID(),
		Name:            "Mountain Image",
		Type:            models.MediaTypeImage,
		URL:             "https://picsum.photos/seed/mountain/1200/700",
		DefaultDuration: 6,
		CreatedAt:       currentTime,
		UpdatedAt:       currentTime,
	}

	flowerVideo := models.Media{
		ID:              bson.NewObjectID(),
		Name:            "Flower Video",
		Type:            models.MediaTypeVideo,
		URL:             "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
		DefaultDuration: 10,
		CreatedAt:       currentTime,
		UpdatedAt:       currentTime,
	}

	cityImage := models.Media{
		ID:              bson.NewObjectID(),
		Name:            "City Image",
		Type:            models.MediaTypeImage,
		URL:             "https://picsum.photos/seed/city/1200/700",
		DefaultDuration: 7,
		CreatedAt:       currentTime,
		UpdatedAt:       currentTime,
	}

	forestImage := models.Media{
		ID:              bson.NewObjectID(),
		Name:            "Forest Image",
		Type:            models.MediaTypeImage,
		URL:             "https://picsum.photos/seed/forest/1200/700",
		DefaultDuration: 6,
		CreatedAt:       currentTime,
		UpdatedAt:       currentTime,
	}

	blankScreen := models.Media{
		ID:              bson.NewObjectID(),
		Name:            "Blank Screen",
		Type:            models.MediaTypeBlank,
		DefaultDuration: 4,
		CreatedAt:       currentTime,
		UpdatedAt:       currentTime,
	}

	mediaDocuments := []any{
		mountainImage,
		flowerVideo,
		cityImage,
		forestImage,
		blankScreen,
	}

	if _, err := mediaCollection.InsertMany(
		contextWithTimeout,
		mediaDocuments,
	); err != nil {
		return err
	}

	windows := []any{
		models.DisplayWindow{
			ID:   bson.NewObjectID(),
			Name: "Lobby Display",
			Playlist: []models.PlaylistItem{
				{
					ID:              bson.NewObjectID(),
					MediaID:         mountainImage.ID,
					Position:        0,
					DisplayDuration: 6,
				},
				{
					ID:              bson.NewObjectID(),
					MediaID:         flowerVideo.ID,
					Position:        1,
					DisplayDuration: 10,
				},
			},
			CycleDurationSeconds: fiveHoursInSeconds,
			CreatedAt:            currentTime,
			UpdatedAt:            currentTime,
		},
		models.DisplayWindow{
			ID:   bson.NewObjectID(),
			Name: "Reception Display",
			Playlist: []models.PlaylistItem{
				{
					ID:              bson.NewObjectID(),
					MediaID:         cityImage.ID,
					Position:        0,
					DisplayDuration: 7,
				},
				{
					ID:              bson.NewObjectID(),
					MediaID:         blankScreen.ID,
					Position:        1,
					DisplayDuration: 4,
				},
				{
					ID:              bson.NewObjectID(),
					MediaID:         mountainImage.ID,
					Position:        2,
					DisplayDuration: 6,
				},
			},
			CycleDurationSeconds: fiveHoursInSeconds,
			CreatedAt:            currentTime,
			UpdatedAt:            currentTime,
		},
		models.DisplayWindow{
			ID:   bson.NewObjectID(),
			Name: "Cafeteria Display",
			Playlist: []models.PlaylistItem{
				{
					ID:              bson.NewObjectID(),
					MediaID:         flowerVideo.ID,
					Position:        0,
					DisplayDuration: 10,
				},
				{
					ID:              bson.NewObjectID(),
					MediaID:         forestImage.ID,
					Position:        1,
					DisplayDuration: 6,
				},
			},
			CycleDurationSeconds: fiveHoursInSeconds,
			CreatedAt:            currentTime,
			UpdatedAt:            currentTime,
		},
	}

	if _, err := windowCollection.InsertMany(
		contextWithTimeout,
		windows,
	); err != nil {
		return err
	}

	log.Println("Inserted 5 media items and 3 display windows")

	return nil
}

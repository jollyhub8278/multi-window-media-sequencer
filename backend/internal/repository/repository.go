package repository

import (
	"context"

	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type Repository struct {
	mediaCollection  *mongo.Collection
	windowCollection *mongo.Collection
	syncCollection   *mongo.Collection
}

func New(database *mongo.Database) *Repository {
	return &Repository{
		mediaCollection:  database.Collection("media"),
		windowCollection: database.Collection("windows"),
		syncCollection:   database.Collection("sync_events"),
	}
}

func (repository *Repository) GetAllMedia(
	context context.Context,
) ([]models.Media, error) {
	cursor, err := repository.mediaCollection.Find(
		context,
		bson.M{},
	)
	if err != nil {
		return nil, err
	}

	defer func() {
		_ = cursor.Close(context)
	}()

	var mediaItems []models.Media

	if err := cursor.All(context, &mediaItems); err != nil {
		return nil, err
	}

	if mediaItems == nil {
		mediaItems = []models.Media{}
	}

	return mediaItems, nil
}

func (repository *Repository) GetAllWindows(
	context context.Context,
) ([]models.DisplayWindow, error) {
	cursor, err := repository.windowCollection.Find(
		context,
		bson.M{},
	)
	if err != nil {
		return nil, err
	}

	defer func() {
		_ = cursor.Close(context)
	}()

	var displayWindows []models.DisplayWindow

	if err := cursor.All(context, &displayWindows); err != nil {
		return nil, err
	}

	if displayWindows == nil {
		displayWindows = []models.DisplayWindow{}
	}

	return displayWindows, nil
}

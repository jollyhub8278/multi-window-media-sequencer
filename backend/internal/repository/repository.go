package repository

import (
	"context"
	"time"

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
	requestContext context.Context,
) ([]models.Media, error) {
	cursor, err := repository.mediaCollection.Find(
		requestContext,
		bson.M{},
	)
	if err != nil {
		return nil, err
	}

	defer func() {
		_ = cursor.Close(requestContext)
	}()

	var mediaItems []models.Media

	if err := cursor.All(
		requestContext,
		&mediaItems,
	); err != nil {
		return nil, err
	}

	if mediaItems == nil {
		mediaItems = []models.Media{}
	}

	return mediaItems, nil
}

func (repository *Repository) GetAllWindows(
	requestContext context.Context,
) ([]models.DisplayWindow, error) {
	cursor, err := repository.windowCollection.Find(
		requestContext,
		bson.M{},
	)
	if err != nil {
		return nil, err
	}

	defer func() {
		_ = cursor.Close(requestContext)
	}()

	var displayWindows []models.DisplayWindow

	if err := cursor.All(
		requestContext,
		&displayWindows,
	); err != nil {
		return nil, err
	}

	if displayWindows == nil {
		displayWindows = []models.DisplayWindow{}
	}

	return displayWindows, nil
}

func (repository *Repository) GetMediaByID(
	requestContext context.Context,
	mediaID bson.ObjectID,
) (models.Media, error) {
	var media models.Media

	err := repository.mediaCollection.FindOne(
		requestContext,
		bson.M{"_id": mediaID},
	).Decode(&media)

	return media, err
}

func (repository *Repository) AddPlaylistItem(
	requestContext context.Context,
	windowID bson.ObjectID,
	mediaID bson.ObjectID,
	displayDuration int,
) (models.PlaylistItem, error) {
	var displayWindow models.DisplayWindow

	err := repository.windowCollection.FindOne(
		requestContext,
		bson.M{"_id": windowID},
	).Decode(&displayWindow)
	if err != nil {
		return models.PlaylistItem{}, err
	}

	playlistItem := models.PlaylistItem{
		ID:              bson.NewObjectID(),
		MediaID:         mediaID,
		Position:        len(displayWindow.Playlist),
		DisplayDuration: displayDuration,
	}

	_, err = repository.windowCollection.UpdateOne(
		requestContext,
		bson.M{"_id": windowID},
		bson.M{
			"$push": bson.M{
				"playlist": playlistItem,
			},
			"$set": bson.M{
				"updated_at": time.Now().UTC(),
			},
		},
	)
	if err != nil {
		return models.PlaylistItem{}, err
	}

	return playlistItem, nil
}

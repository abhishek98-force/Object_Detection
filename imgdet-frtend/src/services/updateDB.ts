//DOA / repo

import { PolygonType, PointType } from '../types';
const port = 5000;
export async function updatePolygonDB(updatedPolygon: PolygonType) {
  const id = updatedPolygon.id;
  const response = await fetch(`http://localhost:${port}/polygons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coord: updatedPolygon.coords,
      label: updatedPolygon.label,
    }),
  });

  if (response.ok) {
    console.log('updated');
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

type PostData = {
  image_url: string | undefined;
};

type includeImageIdPolygonProperty = {
  id: string;
  polygons: PolygonType[];
};

export async function fetchPolygons(
  postData: PostData
): Promise<includeImageIdPolygonProperty> {
  try {
    const response = await fetch(`http://localhost:${port}/api/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const polygonsWrapper = await response.json();
    return polygonsWrapper;
  } catch (error) {
    console.error('An error occurred while fetching the polygons:', error);
    throw error;
  }
}

type addConstructedPolygonParameterType = {
  id: string;
  label: string;
  coords: PointType[];
};

export async function addConstructedPolygon(
  reqData: addConstructedPolygonParameterType
): Promise<PolygonType> {
  try {
    const response = await fetch(
      `http://localhost:${port}/api/add_constructed_marker`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reqData),
      }
    );
    return response.json();
  } catch (error) {
    console.error('An error occurred while adding the polygons:', error);
    throw error;
  }
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, HStack, Heading, IconButton, Spacer, Tooltip as ButtonTooltip } from '@chakra-ui/react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import Card from 'components/Card';
import CardBody from 'components/Card/CardBody';
import CardHeader from 'components/Card/CardHeader';
import { axiosAnalytics } from 'utils/axiosInstances';

interface ClientEntry {
  timestamp: number;
  noise: number;
  rssi: number;
  rx_bitrate: number;
  rx_chwidth: number;
  rx_bytes: number;
  tx_bitrate: number;
  tx_bytes: number;
  tx_chwidth: number;
  tx_retries: number;
  bssid: string;
}

interface ApiResponse {
  entries: ClientEntry[];
}


const getSelectedClientDetail = async (
  venueId: string,
  mac: string,
  fromDate: number,
  endDate: number
): Promise<ClientEntry[]> =>
  axiosAnalytics
    .get(`wifiClientHistory/${mac}?venue=${venueId}&limit=1000&offset=0&fromDate=${fromDate}&endDate=${endDate}&orderBy=timestamp:a`)
    .then(({ data }) => data.entries as ClientEntry[]);

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Convert seconds to ms
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatClientDataForGraph = (entries: ClientEntry[]) => {
  if (!entries || entries.length === 0) {
    return null; // or return an empty structure
  }

  let previousBSSID = '';
  const labels: string[] = [];
  
  entries.forEach((entry) => {
    const formattedTime = formatTimestamp(entry.timestamp);
    const isBSSIDChanged = entry.bssid !== previousBSSID;
    previousBSSID = entry.bssid;

    // labels.push(isBSSIDChanged ? `✅ ${formattedTime}` : formattedTime);
    labels.push(isBSSIDChanged ? `🛑 ${formattedTime}` : formattedTime);
  });


  const data = {
    labels,
    datasets: [
      {
        label: 'noise',
        data: entries.map((e) => e.noise),
        borderColor: '#8c5df2',
        backgroundColor: '#8c5df2',
        yAxisID: 'y',
      },
      {
        label: 'rssi',
        data: entries.map((e) => e.rssi),
        borderColor: '#6667ee',
        backgroundColor: '#6667ee',
        yAxisID: 'y1',
      },
      {
        label: 'rx_bitrate',
        data: entries.map((e) => e.rx_bitrate),
        borderColor: '#3f83f4',
        backgroundColor: '#3f83f4',
        yAxisID: 'y2',
      },
      {
        label: 'rx_chwidth',
        data: entries.map((e) => e.rx_chwidth),
        borderColor: '#88d9bd',
        backgroundColor: '#88d9bd',
        yAxisID: 'y3',
      },
      {
        label: 'rx_bytes',
        data: entries.map((e) => e.rx_bytes),
        borderColor: '#ec4897',
        backgroundColor: '#ec4897',
        yAxisID: 'y4',
      },
      {
        label: 'tx_bitrate',
        data: entries.map((e) => e.tx_bitrate),
        borderColor: '#8c5df2',
        backgroundColor: '#8c5df2',
        yAxisID: 'y5',
      },
      {
        label: 'tx_bytes',
        data: entries.map((e) => e.tx_bytes),
        borderColor: '#666701',
        backgroundColor: '#666701',
        yAxisID: 'y6',
      },
      {
        label: 'tx_chwidth',
        data: entries.map((e) => e.tx_chwidth),
        borderColor: '#3f80c4',
        backgroundColor: '#3f80c4',
        yAxisID: 'y7',
      },
      {
        label: 'tx_retries',
        data: entries.map((e) => e.tx_retries),
        borderColor: '#3bd391',
        backgroundColor: '#3bd391',
        yAxisID: 'y8',
      },
    ],
  };

  return data;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const ClientLifecyleGraph: React.FC<{
    venueId: string;
    mac?: string;
    fromDate: number;
    endDate: number;
    timePickers: React.ReactNode;
    searchBar: React.ReactNode;
  }> = ({ venueId, mac, fromDate, endDate, timePickers, searchBar }) => {

  const chartRef = useRef<any>(null);
  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      zoom: {
        zoom: {
          drag: {
            enabled: true,
            borderColor: 'rgba(54,162,235,0.5)',
            borderWidth: 1,
            backgroundColor: 'rgba(54,162,235,0.15)'
          },
          mode: 'x', // zoom along x-axis only
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
        limits: {
          x: { minRange: 1 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 16 // Title font size
        },
        bodyFont: {
          size: 14 // Body text size
        },
        padding: 10, // Increases overall area
        boxPadding: 6, // Space between label color box and text
        cornerRadius: 6, // Rounded corners
        displayColors: true // Show colored boxes for datasets
      },
      title: {
        display: false,
        text: 'Chart.js Line Chart - Multi Axis',
      },
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'circle', // Change to 'circle', 'triangle', etc.
          font: {
            size: 16,
            weight: '500',
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: false,
        position: 'left' as const,
      },
      y1: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y3: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y4: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y5: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y6: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y7: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y8: {
        type: 'linear',
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const { t } = useTranslation();
  const [graphData, setGraphData] = useState<any>(null);

  useEffect(() => {
    if (venueId && mac) {
      getClientData().then((entries) => {
        if (entries) {
          const formattedData = formatClientDataForGraph(entries);
          setGraphData(formattedData);
        }
      });
    }
  }, [venueId, mac, fromDate, endDate]);

  const getClientData = useCallback(async (): Promise<ClientEntry[] | undefined> => {
    try {
      return await getSelectedClientDetail(venueId, mac!, fromDate, endDate);
    } catch (e) {
      console.error('Error fetching client data:', e);
      return undefined;
    }
  }, [venueId, mac, fromDate, endDate]);

  return (
    <Card mt={5}>
      <CardHeader>
        <Heading size="md" mr={2}>
          {t('analytics.client_lifecycle_graph')}
        </Heading>
        {searchBar}
        <Spacer />
        <HStack>
          <ButtonTooltip label={t('common.reset_graph')}>
            <IconButton
              title="reset"
              aria-label="refresh"
              colorScheme="gray"
              onClick={() => chartRef.current?.resetZoom()}
              icon={<ArrowsClockwise size={20} />}
            />
          </ButtonTooltip>
          {timePickers}
        </HStack>
      </CardHeader>
      <CardBody>
        <Box w="100%">
          {mac && graphData ? (
            <Box overflowX="auto" w="100%">
              <Line options={options} data={graphData} ref={chartRef} />
            </Box>
          ) : null}
        </Box>
      </CardBody>
    </Card>
  );
};

export default ClientLifecyleGraph;
